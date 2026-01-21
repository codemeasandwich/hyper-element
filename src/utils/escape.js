/**
 * @file HTML escaping utilities for XSS prevention.
 */

/**
 * Escapes HTML special characters to prevent XSS.
 * @param {string} str - The string to escape
 * @returns {string} The escaped string
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Symbol used to mark content as safe HTML (no escaping needed).
 * @type {Symbol}
 */
export const SAFE_HTML = Symbol('safeHtml');

/**
 * Marks a string as safe HTML that should not be escaped.
 * @param {string} html - The HTML string to mark as safe
 * @returns {Object} An object with the safe HTML and marker symbol
 */
export function safeHtml(html) {
  return { [SAFE_HTML]: true, value: html };
}

/**
 * Checks if a value is marked as safe HTML.
 * @param {any} val - The value to check
 * @returns {boolean} True if the value is marked as safe HTML
 */
export function isSafeHtml(val) {
  return val && val[SAFE_HTML] === true;
}
