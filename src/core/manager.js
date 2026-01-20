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
export const manager = {};

/**
 * Shared attributes storage for passing functions/objects to child custom elements.
 * Keys are random IDs, values contain the attribute name, value, and target localName.
 * @type {Object<string, {attrName: string, val: any, localName: string}>}
 */
export const sharedAttrs = {};
