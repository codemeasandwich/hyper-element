# src/ Files

## Directory Structure

```
src/
├── attributes/
├── core/
├── html/
├── hyperElement.js
├── index.js
├── lifecycle/
├── template/
└── utils/
```

## Files

### `hyperElement.js`

Main `hyperElement` base class. Extends `HTMLElement` and provides the core API including `connectedCallback`, `attributeChangedCallback`, `disconnectedCallback`, `setup()`, and `render()` lifecycle methods.

### `index.js`

Module entry point. Re-exports `hyperElement` as both named and default export.
