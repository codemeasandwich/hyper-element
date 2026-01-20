# src/core/ Files

## Directory Structure

```
core/
├── constants.js
└── manager.js
```

## Files

### `constants.js`

Shared constants and regex patterns. Exports `isCustomTag` regex for detecting custom element tags in template strings (matches `<my-element`, `<custom-component`, etc.).

### `manager.js`

Global state management. Exports `manager` object (maps Symbol identifiers to element state) and `sharedAttrs` object (stores functions/objects passed to child custom elements).
