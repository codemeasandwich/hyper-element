/**
 * @file Advanced template processing with Handlebars-like syntax.
 * Processes {#each}, {#if}, {#unless} constructs in templates.
 */

/**
 * Processes Handlebars-like constructs in template strings.
 * Supports {#each array}...{/each}, {#if condition}...{else}...{/if},
 * and {#unless condition}...{/unless} syntax.
 *
 * @param {string} template - The template string with advanced constructs
 * @param {Object} data - Data object for template interpolation
 * @returns {string} Processed template string with constructs resolved
 * @example
 * processAdvancedTemplate(
 *   '{#each items}{.}{/each}',
 *   { items: ['a', 'b', 'c'] }
 * ); // Returns 'abc'
 */
export function processAdvancedTemplate(template, data) {
  let result = template;

  // Process {#each array}...{/each}
  const eachRegex = /\{#each\s+(\w+)\}([\s\S]*?)\{\/each\}/g;
  result = result.replace(eachRegex, (match, arrayName, content) => {
    const arr = data[arrayName];
    if (!Array.isArray(arr)) return '';
    return arr
      .map((item, index) => {
        let itemContent = content;
        // Replace {.} with current item (for primitives)
        itemContent = itemContent.replace(/\{\.\}/g, item);
        // Replace {@index} with current index
        itemContent = itemContent.replace(/\{@index\}/g, index);
        // If item is object, replace {prop} with item.prop
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach((key) => {
            itemContent = itemContent.replace(
              new RegExp('\\{' + key + '\\}', 'g'),
              item[key]
            );
          });
        }
        return itemContent;
      })
      .join('');
  });

  // Process {#if condition}...{else}...{/if}
  const ifElseRegex = /\{#if\s+(\w+)\}([\s\S]*?)\{else\}([\s\S]*?)\{\/if\}/g;
  result = result.replace(
    ifElseRegex,
    (match, condition, ifContent, elseContent) => {
      return data[condition] ? ifContent : elseContent;
    }
  );

  // Process {#if condition}...{/if} (without else)
  const ifRegex = /\{#if\s+(\w+)\}([\s\S]*?)\{\/if\}/g;
  result = result.replace(ifRegex, (match, condition, content) => {
    return data[condition] ? content : '';
  });

  // Process {#unless condition}...{/unless}
  const unlessRegex = /\{#unless\s+(\w+)\}([\s\S]*?)\{\/unless\}/g;
  result = result.replace(unlessRegex, (match, condition, content) => {
    return data[condition] ? '' : content;
  });

  return result;
}
