# src/attributes/ Files

## Directory Structure

```
attributes/
├── attachAttrs.js
├── dataset.js
└── parseAttribute.js
```

## Files

### `attachAttrs.js`

Attaches attributes from the element to the context object. Handles template attributes, shared function/object attributes via `fn-`/`ob-` prefixes, and numeric coercion.

### `dataset.js`

Dataset proxy utilities. Provides `getDataset()` to create a proxied dataset with automatic type coercion, and `addDataset()` to add individual properties with getter/setter conversion.

### `parseAttribute.js`

Attribute value parser. Converts string values to appropriate JavaScript types: numbers, booleans, JSON arrays/objects, and handles the special `template` attribute.
