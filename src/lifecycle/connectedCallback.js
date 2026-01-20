/**
 * @file Core initialization logic for hyper-element connectedCallback.
 * Sets up the element instance, observers, and render pipeline.
 */

import { manager } from '../core/manager.js';
import { observer } from './observer.js';
import { onNext } from './onNext.js';
import { buildTemplate } from '../template/buildTemplate.js';
import { createHtml } from '../html/createHtml.js';
import { addDataset } from '../attributes/dataset.js';

/**
 * Result object returned from fragment methods (methods starting with capital letter).
 * @typedef {Object} FragmentResult
 * @property {any} [any] - Rendered content
 * @property {boolean} [once] - Render only once
 * @property {string|Promise} [template] - Template string or promise
 * @property {Object|Array} [values] - Template values
 * @property {string} [text] - Text content
 * @property {string} [html] - HTML content
 * @property {any} [placeholder] - Placeholder content
 */

/**
 * Core initialization callback, called when element is connected to DOM.
 * Sets up the element instance, observers, fragment definitions, and initial render.
 *
 * @this {HTMLElement} The custom element instance (must be a hyperElement subclass)
 * @returns {void}
 */
export function createdCallback() {
  // Create unique identifier for this instance
  this.identifier = Symbol(this.localName);
  const ref = (manager[this.identifier] = { attrsToIgnore: {} });
  ref.innerHTML = this.innerHTML;
  const that = (ref.this = { element: this });
  that.wrappedContent = this.textContent;

  observer.call(this, ref); // observer change to innerHTML

  Object.getOwnPropertyNames(this.__proto__)
    .filter(
      (name) =>
        !('constructor' === name || 'setup' === name || 'render' === name)
    )
    .forEach((name) => {
      if (/^[A-Z]/.test(name)) {
        let result;
        const templatestrings = {};
        /**
         * Wraps a fragment method to handle template processing and caching.
         * @param {Object} data - Data passed to the fragment
         * @returns {FragmentResult} The fragment result
         */
        const wrapFragment = (data) => {
          if (undefined !== result && result.once) return result;

          result = this[name](data);
          if (result.template) {
            if ('string' === typeof result.template) {
              if (!templatestrings[result.template]) {
                templatestrings[result.template] = buildTemplate(
                  result.template
                );
              }
              result = {
                any: templatestrings[result.template](result.values || data),
              };
            } else if (
              'object' === typeof result.template &&
              'function' === typeof result.template.then
            ) {
              result = Object.assign({}, result, {
                any: result.template.then((args) => {
                  let { template, values } = args;
                  if (!template && 'string' === typeof args) {
                    template = args;
                    values = {};
                  }

                  if (!templatestrings[template]) {
                    templatestrings[template] = buildTemplate(template);
                  }
                  if (Array.isArray(values)) {
                    result = {
                      any: values.map(templatestrings[template]),
                      once: result.once,
                    };
                  } else {
                    result = {
                      any: templatestrings[template](values || data),
                      once: result.once,
                    };
                  }
                  return result.any;
                }),
              });
            } else {
              throw new Error(
                'unknow template type:' +
                  typeof result.template +
                  ' | ' +
                  JSON.stringify(result.template)
              );
            }
          }
          return result;
        };
        hyperHTML.define(name, wrapFragment);
      } else {
        that[name] = this[name].bind(that);
      }
      delete this[name];
    });

  /**
   * Custom toString for element context.
   * @returns {string} String representation
   */
  function toString() {
    return 'hyper-element: ' + this.localName;
  }
  Object.defineProperty(that, 'toString', {
    value: toString.bind(this),
    writable: false,
  });

  // Use shadow DOM, else fallback to render to element
  ref.shadow = this;

  // Create the Html function and attach to ref
  ref.Html = createHtml(ref.shadow);

  // Guard removed: this.attrs is set by the library, cannot be pre-defined by user
  that.attrs = this.attachAttrs(this.attributes);
  that.dataset = this.getDataset();
  const render = this.render;
  this.render = (...data) => {
    ref.observe = false;
    setTimeout(() => {
      ref.observe = true;
    }, 0);

    render.call(that, ref.Html, ...data);

    // After render check if dataset has changed
    Object.getOwnPropertyNames(that.dataset)
      .filter((key) => !this.dataset[key])
      .forEach((key) => {
        const value = that.dataset[key];
        addDataset.call(
          this,
          that.dataset,
          key.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`)
        );
        that.dataset[key] = value;
      });
  };

  if (this.setup) {
    ref.teardown = this.setup.call(that, onNext.bind(this, that));
  }

  this.render();
}
