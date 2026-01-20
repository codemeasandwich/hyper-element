# src/html/ Files

## Directory Structure

```
html/
└── createHtml.js
```

## Files

### `createHtml.js`

Creates the `Html` tagged template function for an element. Intercepts function/object values passed to custom elements and stores them in `sharedAttrs` for retrieval by child elements. Also exposes `Html.wire()` and `Html.lite()` methods.
