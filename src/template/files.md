# src/template/ Files

## Directory Structure

```
template/
├── buildTemplate.js
└── processAdvancedTemplate.js
```

## Files

### `buildTemplate.js`

Template compiler. Builds a template function from innerHTML strings. Detects advanced syntax and delegates to `processAdvancedTemplate` or uses simple `{var}` interpolation with `hyperHTML.wire()`.

### `processAdvancedTemplate.js`

Advanced template processor. Handles Handlebars-like constructs: `{#each array}...{/each}`, `{#if condition}...{else}...{/if}`, and `{#unless condition}...{/unless}`.
