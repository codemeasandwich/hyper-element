/**
 * @file DOM list diffing algorithm.
 * Based on udomdiff - https://github.com/WebReflection/udomdiff
 *
 * ISC License
 *
 * Copyright (c) 2020, Andrea Giammarchi, @WebReflection
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
 * OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */

/**
 * Efficiently reconciles two arrays of DOM nodes using multiple fast paths.
 * @param {Node[]} a - The list of current/live children
 * @param {Node[]} b - The list of future children
 * @param {(entry: Node, action: number) => Node} get - Callback per DOM operation
 * @param {Node} before - The anchor node to insert before
 * @returns {Node[]} The same list of future children
 */
export function diff(a, b, get, before) {
  const parentNode = before.parentNode;
  const bLength = b.length;
  let aEnd = a.length;
  let bEnd = bLength;
  let aStart = 0;
  let bStart = 0;
  let map = null;

  while (aStart < aEnd || bStart < bEnd) {
    // append head, tail, or nodes in between: fast path
    if (aEnd === aStart) {
      const node =
        bEnd < bLength
          ? bStart
            ? get(b[bStart - 1], -0).nextSibling
            : get(b[bEnd], 0)
          : before;
      while (bStart < bEnd) parentNode.insertBefore(get(b[bStart++], 1), node);
    }
    // remove head or tail: fast path
    else if (bEnd === bStart) {
      while (aStart < aEnd) {
        if (!map || !map.has(a[aStart])) get(a[aStart], -1).remove();
        aStart++;
      }
    }
    // same node: fast path
    else if (a[aStart] === b[bStart]) {
      aStart++;
      bStart++;
    }
    // same tail: fast path
    else if (a[aEnd - 1] === b[bEnd - 1]) {
      aEnd--;
      bEnd--;
    }
    // reverse swap: also fast path
    else if (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]) {
      const node = get(a[--aEnd], -0).nextSibling;
      parentNode.insertBefore(
        get(b[bStart++], 1),
        get(a[aStart++], -0).nextSibling
      );
      parentNode.insertBefore(get(b[--bEnd], 1), node);
      a[aEnd] = b[bEnd];
    }
    // map based fallback, "slow" path
    else {
      if (!map) {
        map = new Map();
        let i = bStart;
        while (i < bEnd) map.set(b[i], i++);
      }

      const index = map.get(a[aStart]) ?? -1;

      if (index < 0) {
        get(a[aStart++], -1).remove();
      } else {
        if (bStart < index && index < bEnd) {
          let i = aStart;
          let sequence = 1;
          while (++i < aEnd && i < bEnd && map.get(a[i]) === index + sequence)
            sequence++;
          if (sequence > index - bStart) {
            const node = get(a[aStart], 0);
            while (bStart < index)
              parentNode.insertBefore(get(b[bStart++], 1), node);
          } else {
            parentNode.replaceChild(get(b[bStart++], 1), get(a[aStart++], -1));
          }
        } else {
          aStart++;
        }
      }
    }
  }
  return b;
}
