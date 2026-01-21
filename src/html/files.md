# src/html/ Files

## Directory Structure

```
html/
├── createHtml.js
└── parseEachBlocks.js
```

## Files

### `createHtml.js`

Creates the `Html` tagged template function for an element. Intercepts function/object values passed to custom elements and stores them in `sharedAttrs` for retrieval by child elements. Also exposes `Html.wire()`, `Html.lite()`, and `Html.raw()` methods.

### `parseEachBlocks.js`

Parses and transforms block syntax (`{+each}`, `{+if}`, `{+unless}`) in Html tagged templates into efficient Html.wire() calls. Handles nested blocks, property references, and conditional rendering.
