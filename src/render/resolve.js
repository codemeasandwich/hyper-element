/**
 * @file Path-based DOM traversal.
 * Resolves a path array to find a node within a DOM tree.
 */

/**
 * Traverses a DOM tree using an inside-out path array.
 * Path is traversed from right to left (reduceRight).
 * Negative indices (-1) indicate entering a <template> element's content.
 * @param {Node} root - The root node to start traversal from
 * @param {number[]} path - Array of child indices (inside-out order)
 * @returns {Node} The resolved node
 */
export function resolve(root, path) {
  return path.reduceRight(
    (node, i) => (i < 0 ? node.content : node.childNodes[i]),
    root
  );
}
