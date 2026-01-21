/**
 * @file Template compiler for hyper-element.
 * Compiles innerHTML templates into reusable template functions.
 */

import { processAdvancedTemplate } from './processAdvancedTemplate.js';
import { escapeHtml } from '../utils/escape.js';

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
export function buildTemplate(innerHTML) {
  // Check if template has advanced features
  const hasAdvanced = /\{\+(if|each|unless)\s/.test(innerHTML);

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
        return data[key] != null ? escapeHtml(String(data[key])) : '';
      });
      // Return as safe HTML - values are already escaped, markup should render
      return { html: result };
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
