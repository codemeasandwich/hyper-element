# src/ Files

## Directory Structure

```
src/
├── attributes/
├── core/
├── functional.js
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

### `functional.js`

Factory function `createFunctionalElement()` that generates hyperElement classes from plain objects or render functions. Supports four signatures: (1) full definition with tag for auto-registration, (2) shorthand render function with tag, (3) definition object without tag for manual registration, (4) shorthand render function without tag.

### `index.js`

Module entry point. Wraps `hyperElement` class in a Proxy to support dual-purpose usage: as a class base for inheritance (`class X extends hyperElement`) or as a factory function (`hyperElement('tag', {...})`) for the functional API.
