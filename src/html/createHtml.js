/**
 * @file Html function factory for hyperHTML binding.
 * Creates the Html tagged template function with shared attribute handling.
 */

import { makeid } from '../utils/makeid.js';
import { sharedAttrs } from '../core/manager.js';
import { isCustomTag } from '../core/constants.js';
import { escapeHtml, safeHtml, isSafeHtml } from '../utils/escape.js';
import { hasEachBlocks, transformEachBlocks } from './parseEachBlocks.js';

/**
 * Tagged template literal function for rendering HTML content.
 * @typedef {Object} HtmlFunction
 * @property {Function} wire - Create wired template bound to an object
 * @property {Function} lite - Create lightweight template
 * @property {Function} [template] - Template function when template attribute is used
 */

/**
 * Creates the Html tagged template function for an element.
 * Handles passing non-string values to child custom elements via shared attributes.
 *
 * @param {HTMLElement} shadow - The element's shadow/content root
 * @returns {HtmlFunction} The Html template function
 */
export function createHtml(shadow) {
  const hyperHTMLbind = hyperHTML.bind(shadow);

  /**
   * Html tagged template function for rendering content.
   * Intercepts non-string values passed to custom elements and stores them for retrieval.
   *
   * @param {...any} args - Tagged template arguments (strings array + values)
   * @returns {any} Result of hyperHTML.bind
   */
  function Html(...args) {
    // Transform {+each}...{-each} blocks to Html.wire() calls
    if (hasEachBlocks(args[0])) {
      const transformed = transformEachBlocks(
        args[0],
        args.slice(1),
        Html.wire
      );
      args = [transformed.strings, ...transformed.values];
    }

    const hasNonString = args
      .slice(1)
      .some((item) => item != null && typeof item !== 'string');
    const hasCustomTag = args[0].some((t) => isCustomTag.test(t));

    if (hasNonString && hasCustomTag) {
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

        if (val != null && typeof val !== 'string') {
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

    // Process values - handle safeHtml markers and escape array strings
    // hyperHTML escapes single strings, but renders array items as HTML fragments
    const processedArgs = [args[0]];
    for (let i = 1; i < args.length; i++) {
      const val = args[i];
      if (isSafeHtml(val)) {
        // Safe HTML (Html.raw()) - wrap in hyperHTML's raw HTML marker
        processedArgs.push({ html: val.value });
      } else if (Array.isArray(val)) {
        // Arrays of strings are rendered as HTML by hyperHTML - escape them
        processedArgs.push(
          val.map((item) => {
            if (isSafeHtml(item)) {
              return { html: item.value };
            } else if (typeof item === 'string') {
              // Escape string items to prevent XSS
              return escapeHtml(item);
            }
            return item;
          })
        );
      } else {
        // Other values pass through unchanged (hyperHTML escapes single strings)
        processedArgs.push(val);
      }
    }

    return hyperHTMLbind(...processedArgs);
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

  /**
   * Marks a string as safe HTML that should not be escaped.
   * Use with caution - only for trusted HTML content.
   * @param {string} html - The HTML string to mark as safe
   * @returns {Object} An object with the safe HTML and marker symbol
   */
  Html.raw = function raw(html) {
    return safeHtml(html);
  };

  return Html;
}
