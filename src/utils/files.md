# src/utils/ Files

## Directory Structure

```
utils/
├── escape.js
└── makeid.js
```

## Files

### `escape.js`

XSS prevention utilities. Exports `escapeHtml()` for escaping HTML entities, `safeHtml()` for marking strings as safe (bypass escaping), `isSafeHtml()` for checking safe markers, and `SAFE_HTML` symbol for internal marking.

### `makeid.js`

Random ID generator. Generates 15-character IDs using consonants only. Used to create unique keys for shared attributes between parent/child custom elements.
