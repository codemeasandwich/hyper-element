/**
 * @file Constants and regex patterns for hyper-element.
 * Contains shared constants used throughout the library.
 */

/**
 * Regular expression to detect custom element tags in template strings.
 * Matches patterns like `<my-element` or `<custom-component`.
 * @type {RegExp}
 */
export const isCustomTag = /<+\w+[-]+\w/;
