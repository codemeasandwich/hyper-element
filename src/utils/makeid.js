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
export function makeid() {
  var text = '';
  var possible = 'bcdfghjklmnpqrstvwxyz';

  for (var i = 0; i < 15; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}
