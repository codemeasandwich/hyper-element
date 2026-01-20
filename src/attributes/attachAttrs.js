/**
 * @file Attribute attachment logic for hyper-element.
 * Attaches and processes element attributes including shared attributes.
 */

import { manager, sharedAttrs } from '../core/manager.js';
import { buildTemplate } from '../template/buildTemplate.js';

/**
 * Attaches attributes from the element to the context object.
 * Handles template attributes, shared function/object attributes, and numeric coercion.
 *
 * @this {HTMLElement} The custom element instance
 * @param {NamedNodeMap} attributes - The element's attributes collection
 * @returns {Object} Object containing all parsed attributes
 */
export function attachAttrs(attributes) {
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
