/**
 * @file Dataset proxy utilities with automatic type coercion.
 * Provides a proxied dataset with automatic type conversion on get/set.
 */

import { parseAttribute } from './parseAttribute.js';
import { manager } from '../core/manager.js';

/**
 * Adds a property to the dataset proxy with automatic type coercion.
 * The property getter parses the value, and the setter handles JSON serialization.
 *
 * @this {HTMLElement} The custom element instance
 * @param {Object} dataset - The proxied dataset object
 * @param {string} dash_key - The kebab-case attribute key (e.g., 'my-value')
 * @returns {void}
 */
export function addDataset(dataset, dash_key) {
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
export function getDataset() {
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
