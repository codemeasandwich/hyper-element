/**
 * @file Html function factory for hyperHTML binding.
 * Creates the Html tagged template function with shared attribute handling.
 */

import { makeid } from '../utils/makeid.js';
import { sharedAttrs } from '../core/manager.js';
import { isCustomTag } from '../core/constants.js';

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
export function createHtml(shadow) {
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
