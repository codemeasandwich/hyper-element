// Browser-only build - UMD wrapper simplified for E2E testing
// CommonJS/AMD paths exist in full build but are not covered by browser tests
(function (factory) {
  window.hyperElement = factory(window.hyperHTML);
})(function (hyperHTML) {

  // core/constants.js
  /**
   * @file Constants and regex patterns for hyper-element.
   * Contains shared constants used throughout the library.
   */

  /**
   * Regular expression to detect custom element tags in template strings.
   * Matches patterns like `<my-element` or `<custom-component`.
   * @type {RegExp}
   */
  const isCustomTag = /<+\w+[-]+\w/;

  // core/manager.js
  /**
   * @file Global state management for hyper-element instances.
   * Manages element instances and shared attributes between parent/child elements.
   */

  /**
   * Reference object storing state for each element instance.
   * @typedef {Object} ManagerRef
   * @property {Object<string, boolean>} attrsToIgnore - Attributes to skip in change callback
   * @property {string} innerHTML - Original innerHTML of the element
   * @property {Object} this - The element context object
   * @property {HTMLElement} shadow - The shadow/element root for rendering
   * @property {Function} Html - The bound Html template function
   * @property {boolean} observe - Whether MutationObserver should process changes
   * @property {Function} [teardown] - Optional teardown function from setup
   */

  /**
   * Map of element identifiers to their manager references.
   * Uses Symbol keys for unique element identification.
   * @type {Object<symbol, ManagerRef>}
   */
  const manager = {};

  /**
   * Shared attributes storage for passing functions/objects to child custom elements.
   * Keys are random IDs, values contain the attribute name, value, and target localName.
   * @type {Object<string, {attrName: string, val: any, localName: string}>}
   */
  const sharedAttrs = {};

  // utils/makeid.js
  /**
   * @file Random ID generator utility.
   * Generates unique identifiers for shared attribute references.
   */

  /**
   * Generates a random 15-character ID using consonants only.
   * Used to create unique keys for shared attributes between parent/child elements.
   * @returns {string} A 15-character random string
   * @example
   * const id = makeid(); // e.g., "bcdfghjklmnpqrs"
   */
  function makeid() {
    var text = '';
    var possible = 'bcdfghjklmnpqrstvwxyz';

    for (var i = 0; i < 15; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }

  // attributes/parseAttribute.js
  /**
   * @file Attribute parser with automatic type coercion.
   * Converts string attribute values to appropriate JavaScript types.
   */

  /**
   * Parses an attribute value and coerces it to the appropriate type.
   * Handles numbers, booleans, JSON arrays/objects, and the special 'template' attribute.
   *
   * @param {string} key - The attribute name
   * @param {string} value - The attribute value as a string
   * @returns {string|number|boolean|Object|Array} The parsed/coerced value
   * @example
   * parseAttribute('count', '42');        // Returns 42 (number)
   * parseAttribute('enabled', 'true');    // Returns true (boolean)
   * parseAttribute('data', '[1,2,3]');    // Returns [1, 2, 3] (array)
   * parseAttribute('template', '');       // Returns true (special case)
   */
  function parseAttribute(key, value) {
    if ('template' === key && '' === value) {
      return true;
    }

    if (+value + '' === value.trim()) {
      return +value; // to number
    }

    const lowerCaseValue = value.toLowerCase().trim();

    if ('true' === lowerCaseValue) {
      return true;
    } else if ('false' === lowerCaseValue) {
      return false;
    }

    if (
      (lowerCaseValue[0] === '[' && lowerCaseValue.slice(-1) === ']') ||
      (lowerCaseValue[0] === '{' && lowerCaseValue.slice(-1) === '}')
    ) {
      return JSON.parse(value);
    }

    return value;
  }

  // template/processAdvancedTemplate.js
  /**
   * @file Advanced template processing with Handlebars-like syntax.
   * Processes {#each}, {#if}, {#unless} constructs in templates.
   */

  /**
   * Processes Handlebars-like constructs in template strings.
   * Supports {#each array}...{/each}, {#if condition}...{else}...{/if},
   * and {#unless condition}...{/unless} syntax.
   *
   * @param {string} template - The template string with advanced constructs
   * @param {Object} data - Data object for template interpolation
   * @returns {string} Processed template string with constructs resolved
   * @example
   * processAdvancedTemplate(
   *   '{#each items}{.}{/each}',
   *   { items: ['a', 'b', 'c'] }
   * ); // Returns 'abc'
   */
  function processAdvancedTemplate(template, data) {
    let result = template;

    // Process {#each array}...{/each}
    const eachRegex = /\{#each\s+(\w+)\}([\s\S]*?)\{\/each\}/g;
    result = result.replace(eachRegex, (match, arrayName, content) => {
      const arr = data[arrayName];
      if (!Array.isArray(arr)) return '';
      return arr
        .map((item, index) => {
          let itemContent = content;
          // Replace {.} with current item (for primitives)
          itemContent = itemContent.replace(/\{\.\}/g, item);
          // Replace {@index} with current index
          itemContent = itemContent.replace(/\{@index\}/g, index);
          // If item is object, replace {prop} with item.prop
          if (typeof item === 'object' && item !== null) {
            Object.keys(item).forEach((key) => {
              itemContent = itemContent.replace(
                new RegExp('\\{' + key + '\\}', 'g'),
                item[key]
              );
            });
          }
          return itemContent;
        })
        .join('');
    });

    // Process {#if condition}...{else}...{/if}
    const ifElseRegex = /\{#if\s+(\w+)\}([\s\S]*?)\{else\}([\s\S]*?)\{\/if\}/g;
    result = result.replace(
      ifElseRegex,
      (match, condition, ifContent, elseContent) => {
        return data[condition] ? ifContent : elseContent;
      }
    );

    // Process {#if condition}...{/if} (without else)
    const ifRegex = /\{#if\s+(\w+)\}([\s\S]*?)\{\/if\}/g;
    result = result.replace(ifRegex, (match, condition, content) => {
      return data[condition] ? content : '';
    });

    // Process {#unless condition}...{/unless}
    const unlessRegex = /\{#unless\s+(\w+)\}([\s\S]*?)\{\/unless\}/g;
    result = result.replace(unlessRegex, (match, condition, content) => {
      return data[condition] ? '' : content;
    });

    return result;
  }

  // template/buildTemplate.js
  /**
   * @file Template compiler for hyper-element.
   * Compiles innerHTML templates into reusable template functions.
   */


  /**
   * Builds a template function from an innerHTML string.
   * Supports both simple {var} interpolation and advanced Handlebars-like syntax.
   *
   * @param {string} innerHTML - The template string to compile
   * @returns {Function} A template function that accepts data and returns rendered content
   * @throws {Error} If template function is called with non-object data
   * @example
   * const template = buildTemplate('<div>{name}</div>');
   * template({ name: 'World' }); // Returns hyperHTML wire result
   */
  function buildTemplate(innerHTML) {
    // Check if template has advanced features
    const hasAdvanced = /\{#(if|each|unless)\s/.test(innerHTML);

    if (hasAdvanced) {
      // Use advanced template processing
      return function template(data) {
        if ('object' !== typeof data) {
          throw new Error(
            'Templates must be passed an object. You passed ' +
              JSON.stringify(data)
          );
        }
        // Process advanced template features
        let result = processAdvancedTemplate(innerHTML, data);
        // Simple variable substitution for remaining {var} patterns
        result = result.replace(/\{(\w+)\}/g, (match, key) => {
          return data[key] != null ? data[key] : '';
        });
        return result;
      };
    }

    // Original simple template processing
    const re = /(\{[\w]+\})/g;
    const templateVals = innerHTML.split(re).reduce(
      (vals, item) => {
        if ('{' === item[0] && '}' === item.slice(-1)) {
          vals.keys.push(item.slice(1, -1));
        } else {
          vals.markup.push(item);
        }

        return vals;
      },
      { markup: [], keys: [] }
    );

    templateVals.id = ':' + templateVals.markup.join().trim();

    /**
     * Creates the template output array for hyperHTML.wire.
     * @param {Object} data - Data object for interpolation
     * @returns {Array} Tagged template array with raw property
     */
    function fragment(data) {
      const output = [
        templateVals.markup,
        ...templateVals.keys.map((key) => data[key]),
      ];
      output.raw = { value: templateVals.markup };
      return output;
    }

    return function template(data) {
      if ('object' !== typeof data) {
        throw new Error(
          'Templates must be passed an object to be populated with. You passed ' +
            JSON.stringify(data) +
            ' to ' +
            templateVals.id
        );
      }
      return hyperHTML.wire(data, templateVals.id)(...fragment(data));
    };
  }

  // attributes/dataset.js
  /**
   * @file Dataset proxy utilities with automatic type coercion.
   * Provides a proxied dataset with automatic type conversion on get/set.
   */



  /**
   * Adds a property to the dataset proxy with automatic type coercion.
   * The property getter parses the value, and the setter handles JSON serialization.
   *
   * @this {HTMLElement} The custom element instance
   * @param {Object} dataset - The proxied dataset object
   * @param {string} dash_key - The kebab-case attribute key (e.g., 'my-value')
   * @returns {void}
   */
  function addDataset(dataset, dash_key) {
    const camel_key = dash_key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

    Object.defineProperty(dataset, camel_key, {
      enumerable: true, // can be selected
      configurable: true, // can be delete
      get: () => parseAttribute(camel_key, this.dataset[camel_key]),
      set: (value) => {
        manager[this.identifier].attrsToIgnore['data-' + dash_key] = true;
        if ('string' === typeof value) {
          this.dataset[camel_key] = value;
        } else {
          this.dataset[camel_key] = JSON.stringify(value);
        }
      },
    });
  }

  /**
   * Creates a proxied dataset object from the element's dataset.
   * Each property is converted from kebab-case to camelCase with type coercion.
   *
   * @this {HTMLElement} The custom element instance
   * @returns {Object} Proxied dataset with automatic type coercion
   */
  function getDataset() {
    const dataset = {};
    Object.keys(this.dataset).forEach((key) =>
      addDataset.call(
        this,
        dataset,
        key.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`)
      )
    );
    return dataset;
  }

  // attributes/attachAttrs.js
  /**
   * @file Attribute attachment logic for hyper-element.
   * Attaches and processes element attributes including shared attributes.
   */



  /**
   * Attaches attributes from the element to the context object.
   * Handles template attributes, shared function/object attributes, and numeric coercion.
   *
   * @this {HTMLElement} The custom element instance
   * @param {NamedNodeMap} attributes - The element's attributes collection
   * @returns {Object} Object containing all parsed attributes
   */
  function attachAttrs(attributes) {
    const accumulator = {};

    for (let i = 0; i < attributes.length; i++) {
      const { value, name } = attributes[i];

      if ('template' === name && !value) {
        const ref = manager[this.identifier];
        ref.Html.template = buildTemplate(ref.innerHTML);
        accumulator[name] = true;
      } else if (
        ('fn-' === value.substr(0, 3) || 'ob-' === value.substr(0, 3)) &&
        !!sharedAttrs[value.substr(3)] &&
        sharedAttrs[value.substr(3)].localName === this.localName
      ) {
        accumulator[name] = sharedAttrs[value.substr(3)].val;
      } else {
        if (+value + '' === (value + '').trim()) {
          accumulator[name] = +value;
        } else {
          accumulator[name] = value;
        }
      }
    }
    return accumulator;
  }

  // html/createHtml.js
  /**
   * @file Html function factory for hyperHTML binding.
   * Creates the Html tagged template function with shared attribute handling.
   */




  /**
   * Tagged template literal function for rendering HTML content.
   * @typedef {Object} HtmlFunction
   * @property {Function} wire - Create wired template bound to an object
   * @property {Function} lite - Create lightweight template
   * @property {Function} [template] - Template function when template attribute is used
   */

  /**
   * Creates the Html tagged template function for an element.
   * Handles passing functions and objects to child custom elements via shared attributes.
   *
   * @param {HTMLElement} shadow - The element's shadow/content root
   * @returns {HtmlFunction} The Html template function
   */
  function createHtml(shadow) {
    const hyperHTMLbind = hyperHTML.bind(shadow);

    /**
     * Html tagged template function for rendering content.
     * Intercepts function/object values passed to custom elements and stores them for retrieval.
     *
     * @param {...any} args - Tagged template arguments (strings array + values)
     * @returns {any} Result of hyperHTML.bind
     */
    function Html(...args) {
      if (
        args
          .slice(1)
          .some(
            (item) =>
              'function' === typeof item ||
              (item !== null && 'object' === typeof item)
          ) &&
        args[0].some((t) => isCustomTag.test(t))
      ) {
        let inCustomTag = false;
        let localName = '';
        args[0].forEach((item, index, _items) => {
          if (isCustomTag.test(item)) {
            inCustomTag =
              -1 === item.substring(item.match(isCustomTag).index).indexOf('>');
            localName =
              inCustomTag &&
              item
                .substring(item.indexOf(item.match(isCustomTag)))
                .split(' ')[0]
                .substr(1);
          } else if (0 <= item.indexOf('>')) {
            inCustomTag = false;
            localName = '';
          }

          if (!inCustomTag) {
            return;
          }
          const val = args[index + 1];

          if (
            'function' === typeof val ||
            (val !== null && 'object' === typeof val)
          ) {
            const attrName = item.split(' ').pop().slice(0, -1);
            if ('on' === attrName.substring(0, 2)) {
              throw new Error(
                `'on' is reserve for native elements. Change: "${attrName}" for "${localName}" to something else`
              );
            }
            // Don't intercept style - let hyperHTML handle it natively
            if ('style' === attrName) {
              return;
            }
            const id = makeid();
            sharedAttrs[id] = { attrName, val, localName };
            args[index + 1] = ('function' === typeof val ? 'fn-' : 'ob-') + id;
          }
        });
      }

      return hyperHTMLbind(...args);
    }

    /**
     * Creates a wired template bound to an object.
     * @param {...any} args - Arguments to pass to hyperHTML.wire
     * @returns {any} Result of hyperHTML.wire
     */
    Html.wire = function wire(...args) {
      return hyperHTML.wire(...args);
    };

    /**
     * Creates a lightweight template without object binding.
     * @param {...any} args - Arguments to pass to hyperHTML
     * @returns {any} Result of hyperHTML
     */
    Html.lite = function lite(...args) {
      return hyperHTML(...args);
    };

    return Html;
  }

  // lifecycle/onNext.js
  /**
   * @file Reactive re-render factory for store-based updates.
   * Creates a render function that automatically passes store state.
   */

  /**
   * Callback for store updates in setup.
   * @callback OnNextCallback
   * @param {any|Function} store - Store value or getter function
   * @returns {Function} Render function with store
   */

  /**
   * Creates a render function that injects store state on each render.
   * This is called from setup() to enable reactive updates when store changes.
   *
   * @this {HTMLElement} The custom element instance
   * @param {Object} that - The element context
   * @param {any|Function} store - Store value or getter function
   * @returns {Function} Render function that includes store state
   * @example
   * // In setup method:
   * setup(onNext) {
   *   const store = { count: 0 };
   *   const render = onNext(() => store);
   *   // render() will now pass store as first argument
   * }
   */
  function onNext(that, store) {
    const storeFn = 'function' == typeof store ? store : () => store;

    const render = this.render;

    /**
     * Wrapped render function that injects store state.
     * @param {...any} data - Additional render data
     * @returns {void}
     */
    const render2 = (...data) => {
      if (undefined === store) {
        that.store = undefined;
        render(...data);
      } else {
        that.store = storeFn();
        render(that.store, ...data);
      }
    };
    this.render = render2;

    return render2;
  }

  // lifecycle/observer.js
  /**
   * @file MutationObserver setup for content and attribute changes.
   * Observes DOM mutations and triggers re-renders when content changes.
   */

  /**
   * Sets up a MutationObserver to watch for content and attribute changes.
   * Re-renders the element when mutations are detected.
   *
   * @this {HTMLElement} The custom element instance (must have attachAttrs, render methods)
   * @param {Object} ref - The manager reference for this element
   * @returns {void}
   */
  function observer(ref) {
    const that = ref.this;
    const mutationObserver = new MutationObserver((mutations) => {
      if (!ref.observe) return;

      // Check for attribute changes
      const attrMutations = mutations.filter((m) => m.type === 'attributes');
      if (attrMutations.length > 0) {
        // Re-attach attrs to pick up new shared attr values
        that.attrs = this.attachAttrs(this.attributes) || {};
        this.render();
        return;
      }

      // Handle content changes
      let textContent = this.textContent;

      ref.innerHTML = this.innerHTML;
      if (that.attrs.template) {
        that.attrs = this.attachAttrs(this.attributes) || {};
      }

      // Reset the element
      hyperHTML.bind(ref.shadow)``;

      that.wrappedContent = textContent;
      this.render();
    });

    mutationObserver.observe(this, {
      // Watch attribute changes to trigger re-renders
      attributes: true,

      // Set to true if additions and removals of the target node's child elements (including text nodes) are to be observed.
      childList: true,

      // Set to true if mutations to target and target's descendants are to be observed.
      subtree: true,
    });
  }

  // lifecycle/connectedCallback.js
  /**
   * @file Core initialization logic for hyper-element connectedCallback.
   * Sets up the element instance, observers, and render pipeline.
   */







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
  function createdCallback() {
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

  // hyperElement.js
  /**
   * @file hyperElement base class definition.
   * The main class that custom elements extend to use hyperHTML templating.
   */





  /**
   * Context object available as `this` in render() and setup() methods.
   * @typedef {Object} ElementContext
   * @property {HTMLElement} element - The DOM element
   * @property {Object} attrs - Parsed attributes from the element
   * @property {Object} dataset - Dataset proxy with automatic type coercion
   * @property {any} [store] - Store value from setup
   * @property {string} wrappedContent - Text content of element
   */

  /**
   * Base class for creating custom elements with hyperHTML templating.
   * Extend this class and implement the render() method to create a custom element.
   *
   * @example
   * class MyElement extends hyperElement {
   *   render(Html) {
   *     Html`<div>Hello ${this.attrs.name}</div>`;
   *   }
   * }
   * customElements.define('my-element', MyElement);
   *
   * @extends HTMLElement
   */
  class hyperElement extends HTMLElement {
    /**
     * Unique identifier for this element instance.
     * @type {symbol}
     */
    identifier;

    /**
     * Gets the innerHTML of the element's shadow/content root.
     * @returns {string} The inner HTML content
     */
    get innerShadow() {
      return manager[this.identifier].shadow.innerHTML;
    }

    /**
     * Called when the element is inserted into a document.
     * Initializes the element, sets up observers, and triggers initial render.
     * @returns {void}
     */
    connectedCallback() {
      createdCallback.call(this);
    }

    /**
     * Adds a property to the dataset proxy with automatic type coercion.
     * @param {Object} dataset - The proxied dataset object
     * @param {string} dash_key - The kebab-case attribute key
     * @returns {void}
     */
    addDataset(dataset, dash_key) {
      addDataset.call(this, dataset, dash_key);
    }

    /**
     * Creates a proxied dataset object from the element's dataset.
     * @returns {Object} Proxied dataset with automatic type coercion
     */
    getDataset() {
      return getDataset.call(this);
    }

    /**
     * Attaches attributes from the element to the context object.
     * @param {NamedNodeMap} attributes - The element's attributes collection
     * @returns {Object} Object containing all parsed attributes
     */
    attachAttrs(attributes) {
      return attachAttrs.call(this, attributes);
    }

    /**
     * Called when an observed attribute changes.
     * Updates the context and triggers re-render if needed.
     *
     * @param {string} name - The attribute name
     * @param {string|null} oldVal - The previous value
     * @param {string|null} newVal - The new value
     * @returns {void}
     */
    attributeChangedCallback(name, oldVal, newVal) {
      // Guard: attributeChangedCallback can fire before connectedCallback
      // when observedAttributes is defined and attributes are set before DOM insertion
      const ref = manager[this.identifier];
      if (!ref) return;

      if (newVal !== null && +newVal + '' === newVal.trim()) {
        newVal = +newVal; // to number
      }
      const { attrsToIgnore } = ref;
      const that = ref.this;
      if (0 <= name.indexOf('data-')) {
        // we have data
        const dataSetName = name.slice('data-'.length);
        if (null === oldVal) {
          this.addDataset(that.dataset, dataSetName);
        } else if (null === newVal) {
          const camel_key = dataSetName.replace(/-([a-z])/g, (g) =>
            g[1].toUpperCase()
          );
          delete that.dataset[camel_key];
        }
      }

      if (newVal === that.attrs[name]) {
        return;
      }
      if (null === newVal) {
        delete that.attrs[name];
      } else {
        that.attrs[name] = newVal;
      }
      if (attrsToIgnore[name]) {
        delete attrsToIgnore[name];
        return;
      } else {
        this.render();
      }
    }

    /**
     * Called when the element is removed from the document.
     * Calls the teardown function if one was returned from setup().
     * @returns {void}
     */
    disconnectedCallback() {
      const ref = manager[this.identifier];
      ref.teardown && ref.teardown();
    }

    /**
     * Optional setup lifecycle method. Called once when the element is connected.
     * Use this to set up stores, subscriptions, or other initialization logic.
     *
     * @param {Function} onNext - Call this with a store value or getter to enable reactive updates
     * @returns {void|Function} Optional teardown function called when element is disconnected
     *
     * @example
     * setup(onNext) {
     *   const store = createStore({ count: 0 });
     *   onNext(store.getState);
     *   return store.subscribe(() => this.render());
     * }
     */
    setup(onNext) {} // eslint-disable-line no-unused-vars

    /**
     * Required render lifecycle method. Called on every render cycle.
     * Use the Html template tag to render content to the element.
     *
     * @param {Object} Html - Tagged template literal function for rendering
     * @param {...any} data - Additional data passed from store updates
     * @returns {void}
     *
     * @example
     * render(Html) {
     *   Html`<div>Hello ${this.attrs.name}!</div>`;
     * }
     */
    render(Html, ...data) {} // eslint-disable-line no-unused-vars
  }

  return hyperElement;
});
