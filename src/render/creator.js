/**
 * @file DOM fragment creator.
 * Creates DOM fragments from HTML strings using template element.
 */

let _creatorTpl = document.createElement('template');
let _creatorRange;

/**
 * Creates a DocumentFragment from an HTML string.
 * Uses template.innerHTML for HTML, Range API for SVG.
 * @param {string} content - The HTML/SVG string to parse
 * @param {boolean} [xml=false] - Whether to use SVG context
 * @returns {DocumentFragment} The parsed fragment
 */
export function createFragment(content, xml = false) {
  if (xml) {
    if (!_creatorRange) {
      _creatorRange = document.createRange();
      _creatorRange.selectNodeContents(
        document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      );
    }
    return _creatorRange.createContextualFragment(content);
  }
  _creatorTpl.innerHTML = content;
  const fragment = _creatorTpl.content;
  _creatorTpl = _creatorTpl.cloneNode(false);
  return fragment;
}
