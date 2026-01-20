# src/html/

Html template function factory for hyperHTML binding.

## Overview

This module creates the `Html` tagged template function used in `render()` methods. It wraps `hyperHTML.bind()` and handles:

- Passing functions and objects to child custom elements via shared attributes
- Automatic `fn-`/`ob-` prefix generation for non-primitive values
- Validation that `on` prefixed attributes are not used on custom elements

## Html

The primary operation is to describe the complete inner content of the element:

```js
render(Html, store) {
  Html`
    <h1>
      Last updated at ${new Date().toLocaleTimeString()}
    </h1>
  `;
}
```

## Html.wire

Create reusable sub-elements with object/id binding for efficient rendering.

The wire takes two arguments `Html.wire(obj, id)`:

1. A reference object to match with the created node, allowing reuse of the existing node
2. A string to identify the markup used, allowing the template to be generated only once

### Example: Rendering a List

```js
Html`
  <ul>
    ${users.map((user) => Html.wire(user, ':user_list_item')`<li>${user.name}</li>`)}
  </ul>
`;
```

### Anti-pattern: Inlining Markup as Strings

**BAD example:** ✗

```js
Html`
  <ul>
    ${users.map((user) => `<li>${user.name}</li>`)}
  </ul>
`;
```

This creates a new node for every element on every render, causing:

- **Negative impact on performance**
- **Output will not be sanitized** - potential XSS vulnerability

## Html.lite

Create once-off sub-elements for integrating external libraries.

### Example: Wrapping jQuery DatePicker

```js
customElements.define(
  'date-picker',
  class extends hyperElement {
    onSelect(dateText, inst) {
      console.log('selected time ' + dateText);
    }

    Date(lite) {
      const inputElem = lite`<input type="text"/>`;
      $(inputElem).datepicker({ onSelect: this.onSelect });
      return {
        any: inputElem,
        once: true,
      };
    }

    render(Html) {
      Html`Pick a date ${{ Date: Html.lite }}`;
    }
  }
);
```

The `once: true` option ensures the fragment is only generated once, preventing the datepicker from being reinitialized on every render.

## Live Examples

- [Hello World](https://codepen.io/codemeasandwich/pen/VOQpqz)
