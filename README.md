# hyper-element

[![npm version](https://img.shields.io/npm/v/hyper-element.svg)](https://www.npmjs.com/package/hyper-element)
[![npm package size](https://img.shields.io/bundlephobia/minzip/hyper-element)](https://bundlephobia.com/package/hyper-element)
[![CI](https://github.com/codemeasandwich/hyper-element/actions/workflows/publish.yml/badge.svg)](https://github.com/codemeasandwich/hyper-element/actions/workflows/publish.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](https://github.com/codemeasandwich/hyper-element)
[![ES6+](https://img.shields.io/badge/ES6+-supported-blue.svg)](https://caniuse.com/es6)

Combining the best of [hyperHTML] and [Custom Elements]! Your new custom-element will be rendered with the super fast **hyperHTML** and will react to tag attribute and store changes.

### If you like it, please [★ it on github](https://github.com/codemeasandwich/hyper-element)

# Installation

## npm

```bash
npm install hyper-element
```

### ES6 Modules

```js
import hyperElement from 'hyper-element';

customElements.define(
  'my-elem',
  class extends hyperElement {
    render(Html) {
      Html`Hello ${this.attrs.who}!`;
    }
  }
);
```

### CommonJS

```js
const hyperElement = require('hyper-element');

customElements.define(
  'my-elem',
  class extends hyperElement {
    render(Html) {
      Html`Hello ${this.attrs.who}!`;
    }
  }
);
```

## CDN (Browser)

For browser environments without a bundler, include both hyperHTML and hyper-element via CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/hyperhtml@latest/index.js"></script>
<script src="https://cdn.jsdelivr.net/npm/hyper-element@latest/build/hyperElement.min.js"></script>
```

The `hyperElement` class will be available globally on `window.hyperElement`.

## Browser Support

hyper-element requires native ES6 class support and the Custom Elements v1 API:

| Browser | Version |
| ------- | ------- |
| Chrome  | 67+     |
| Firefox | 63+     |
| Safari  | 10.1+   |
| Edge    | 79+     |

For older browsers, a [Custom Elements polyfill](https://github.com/webcomponents/polyfills/tree/master/packages/custom-elements) may be required.

## Why hyper-element

- hyper-element is fast & small
  - With only 1 dependency: [hyperHTML]
- With a completely stateless approach, setting and reseting the view is trivial
- Simple yet powerful [Interface](#interface)
- Built in [template](#templates) system to customise the rendered output
- Inline style objects supported (similar to React)
- First class support for [data stores](#connecting-to-a-data-store)
- Pass `function` to other custom hyper-elements via there tag attribute

# [Live Demo](https://jsfiddle.net/codemeasandwich/k25e6ufv/)

## Live Examples

| Example              | Description                         | Link                                                       |
| -------------------- | ----------------------------------- | ---------------------------------------------------------- |
| Hello World          | Basic element creation              | [CodePen](https://codepen.io/codemeasandwich/pen/VOQpqz)   |
| Attach a Store       | Store integration with setup()      | [CodePen](https://codepen.io/codemeasandwich/pen/VOQWeN)   |
| Templates            | Using the template system           | [CodePen](https://codepen.io/codemeasandwich/pen/LoQLrK)   |
| Child Element Events | Passing functions to child elements | [CodePen](https://codepen.io/codemeasandwich/pen/rgdvPX)   |
| Async Fragments      | Loading content asynchronously      | [CodePen](https://codepen.io/codemeasandwich/pen/MdQrVd)   |
| Styling              | React-style inline styles           | [CodePen](https://codepen.io/codemeasandwich/pen/RmQVKY)   |
| Full Demo            | Complete feature demonstration      | [JSFiddle](https://jsfiddle.net/codemeasandwich/k25e6ufv/) |

---

- [Browser Support](#browser-support)
- [Define a Custom Element](#define-a-custom-element)
- [Lifecycle](#lifecycle)
- [Interface](#interface)
  - [render](#render)
  - [Html](#html)
  - [Html.wire](#htmlwire)
  - [Html.lite](#htmllite)
  - [setup](#setup)
  - [this](#this)
- [Advanced Attributes](#advanced-attributes)
- [Templates](#templates)
  - [Basic Syntax](#basic-template-syntax)
  - [Conditionals](#conditionals-if)
  - [Negation](#negation-unless)
  - [Iteration](#iteration-each)
- [Fragments](#fragments)
- [Styling](#styling)
- [Connecting to a Data Store](#connecting-to-a-data-store)
  - [Backbone](#backbone)
  - [MobX](#mobx)
  - [Redux](#redux)
- [Best Practices](#best-practices)
- [Development](#development)

---

# Define a custom-element

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://cdn.jsdelivr.net/npm/hyperhtml@latest/index.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/hyper-element@latest/build/hyperElement.min.js"></script>
  </head>
  <body>
    <my-elem who="world"></my-elem>
    <script>
      customElements.define(
        'my-elem',
        class extends hyperElement {
          render(Html) {
            Html`hello ${this.attrs.who}`;
          }
        }
      );
    </script>
  </body>
</html>
```

Output

```html
<my-elem who="world"> hello world </my-elem>
```

**Live Example of [helloworld](https://codepen.io/codemeasandwich/pen/VOQpqz)**

---

# Lifecycle

When a hyper-element is connected to the DOM, it goes through the following initialization sequence:

1. Element connected to DOM
2. Unique identifier created
3. MutationObserver attached (watches for attribute/content changes)
4. Fragment methods defined (methods starting with capital letters)
5. Attributes and dataset attached to `this`
6. `setup()` called (if defined)
7. Initial `render()` called

After initialization, the element will automatically re-render when:

- Attributes change
- Content mutations occur (innerHTML/textContent changes)
- Store updates trigger `onStoreChange()`

---

# Interface

## Define your element

There are 2 functions. `render` is _required_ and `setup` is _optional_

## render

This is what will be displayed within your element. Use the `Html` to define your content.

```js
render(Html, store) {
  Html`
    <h1>
      Last updated at ${new Date().toLocaleTimeString()}
    </h1>
  `;
}
```

The second argument `store` contains the value returned from your store function (if using `setup()`).

---

## Html

The primary operation is to describe the complete inner content of the element.

```js
render(Html, store) {
  Html`
    <h1>
      Last updated at ${new Date().toLocaleTimeString()}
    </h1>
  `;
}
```

The `Html` has a primary operation and two utilities: `.wire` & `.lite`

---

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

---

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

---

## setup

The `setup` function wires up an external data-source. This is done with the `attachStore` argument that binds a data source to your renderer.

```js
setup(attachStore) {
  // the getMouseValues function will be called before each render and passed to render
  const onStoreChange = attachStore(getMouseValues);

  // call onStoreChange on every mouse event
  onMouseMove(onStoreChange);

  // cleanup logic
  return () => console.warn('On remove, do component cleanup here');
}
```

**Live Example of [attach a store](https://codepen.io/codemeasandwich/pen/VOQWeN)**

### Re-rendering Without a Data Source

You can trigger re-renders without any external data:

```js
setup(attachStore) {
  setInterval(attachStore(), 1000); // re-render every second
}
```

### Set Initial Values

Pass static data to every render:

```js
setup(attachStore) {
  attachStore({ max_levels: 3 }); // passed to every render
}
```

### Cleanup on Removal

Return a function from `setup` to run cleanup when the element is removed from the DOM:

```js
setup(attachStore) {
  let newSocketValue;
  const onStoreChange = attachStore(() => newSocketValue);
  const ws = new WebSocket('ws://127.0.0.1/data');

  ws.onmessage = ({ data }) => {
    newSocketValue = JSON.parse(data);
    onStoreChange();
  };

  // Return cleanup function
  return ws.close.bind(ws);
}
```

### Multiple Subscriptions

You can trigger re-renders from multiple sources:

```js
setup(attachStore) {
  const onStoreChange = attachStore(user);

  mobx.autorun(onStoreChange); // update when changed (real-time feedback)
  setInterval(onStoreChange, 1000); // update every second (update "the time is now ...")
}
```

---

## this

Available properties and methods on `this`:

| Property              | Description                                                                 |
| --------------------- | --------------------------------------------------------------------------- |
| `this.attrs`          | Attributes on the tag. `<my-elem min="0" max="10" />` = `{ min:0, max:10 }` |
| `this.store`          | Value returned from the store function. _Only updated before each render_   |
| `this.wrappedContent` | Text content between your tags. `<my-elem>Hi!</my-elem>` = `"Hi!"`          |
| `this.element`        | Reference to your created DOM element                                       |
| `this.dataset`        | Read/write access to all `data-*` attributes                                |

### this.attrs

Attributes are automatically type-coerced:

| Input     | Output    | Type   |
| --------- | --------- | ------ |
| `"42"`    | `42`      | Number |
| `"3.14"`  | `3.14`    | Number |
| `"hello"` | `"hello"` | String |

### this.dataset

The dataset provides proxied access to `data-*` attributes with automatic JSON parsing:

| Attribute Value          | `this.dataset` Value | Type    |
| ------------------------ | -------------------- | ------- |
| `data-count="42"`        | `42`                 | Number  |
| `data-active="true"`     | `true`               | Boolean |
| `data-active="false"`    | `false`              | Boolean |
| `data-users='["a","b"]'` | `["a", "b"]`         | Array   |
| `data-config='{"x":1}'`  | `{ x: 1 }`           | Object  |

**Example:**

```html
<my-elem data-users='["ann","bob"]'></my-elem>
```

```js
this.dataset.users; // ["ann", "bob"]
```

The `dataset` is a **live reflection**. Changes update the matching data attribute on the element:

```js
this.dataset.user = { name: 'Alice' }; // Updates data-user attribute
```

---

## Advanced Attributes

### Dynamic Attributes with Custom-element Children

Being able to set attributes at run-time should be the same for dealing with a native element and ones defined by hyper-element.

**⚠ To support dynamic attributes on custom elements YOU MUST USE `customElements.define` which requires native ES6 support! Use `/build/hyperElement.min.js`.**

This is what allows for the passing any dynamic attributes from parent to child custom element! You can also pass a `function` to a child element (that extends hyperElement).

**Example:**

```js
window.customElements.define(
  'a-user',
  class extends hyperElement {
    render(Html) {
      const onClick = () => this.attrs.hi('Hello from ' + this.attrs.name);
      Html`${this.attrs.name} <button onclick=${onClick}>Say hi!</button>`;
    }
  }
);

window.customElements.define(
  'users-elem',
  class extends hyperElement {
    onHi(val) {
      console.log('hi was clicked', val);
    }
    render(Html) {
      Html`<a-user hi=${this.onHi} name="Beckett" />`;
    }
  }
);
```

**Live Example of passing an [onclick to a child element](https://codepen.io/codemeasandwich/pen/rgdvPX)**

---

# Templates

You can declare markup to be used as a template within the custom element.

To enable templates:

1. Add a `template` attribute to your custom element
2. Define the template markup within your element

**Example:**

```html
<my-list template data-json='[{"name":"ann","url":""},{"name":"bob","url":""}]'>
  <div>
    <a href="{url}">{name}</a>
  </div>
</my-list>
```

```js
customElements.define(
  'my-list',
  class extends hyperElement {
    render(Html) {
      Html`${this.dataset.json.map((user) => Html.template(user))}`;
    }
  }
);
```

Output:

```html
<my-list template data-json='[{"name":"ann","url":""},{"name":"bob","url":""}]'>
  <div>
    <a href="">ann</a>
  </div>
  <div>
    <a href="">bob</a>
  </div>
</my-list>
```

**Live Example of using [templates](https://codepen.io/codemeasandwich/pen/LoQLrK)**

---

## Basic Template Syntax

Templates support handlebars-like syntax:

| Syntax                             | Description                           |
| ---------------------------------- | ------------------------------------- |
| `{variable}`                       | Simple interpolation                  |
| `{#if condition}...{/if}`          | Conditional rendering                 |
| `{#if condition}...{else}...{/if}` | Conditional with else                 |
| `{#unless condition}...{/unless}`  | Negative conditional (opposite of if) |
| `{#each items}...{/each}`          | Iteration over arrays                 |
| `{.}`                              | Current item in each loop             |
| `{@index}`                         | Current index in each loop (0-based)  |

---

## Conditionals: {#if}

Show content based on a condition:

```html
<status-elem template>{#if active}Online{else}Offline{/if}</status-elem>
```

```js
customElements.define(
  'status-elem',
  class extends hyperElement {
    render(Html) {
      Html`${Html.template({ active: true })}`;
    }
  }
);
```

Output: `Online`

---

## Negation: {#unless}

Show content when condition is falsy (opposite of #if):

```html
<warning-elem template>{#unless valid}Invalid input!{/unless}</warning-elem>
```

```js
customElements.define(
  'warning-elem',
  class extends hyperElement {
    render(Html) {
      Html`${Html.template({ valid: false })}`;
    }
  }
);
```

Output: `Invalid input!`

---

## Iteration: {#each}

Loop over arrays:

```html
<list-elem template>
  <ul>
    {#each items}
    <li>{name}</li>
    {/each}
  </ul>
</list-elem>
```

```js
customElements.define(
  'list-elem',
  class extends hyperElement {
    render(Html) {
      Html`${Html.template({ items: [{ name: 'Ann' }, { name: 'Bob' }] })}`;
    }
  }
);
```

Output:

```html
<ul>
  <li>Ann</li>
  <li>Bob</li>
</ul>
```

### Special Variables in {#each}

- `{.}` - The current item (useful for arrays of primitives)
- `{@index}` - The current index (0-based)

```html
<nums-elem template>{#each numbers}{@index}: {.}, {/each}</nums-elem>
```

```js
customElements.define(
  'nums-elem',
  class extends hyperElement {
    render(Html) {
      Html`${Html.template({ numbers: ['a', 'b', 'c'] })}`;
    }
  }
);
```

Output: `0: a, 1: b, 2: c, `

---

# Fragments

Fragments are pieces of content that can be loaded _asynchronously_.

You define one with a class property starting with a **capital letter**.

The fragment function should return an object with:

- **placeholder:** the placeholder to show while resolving
- **once:** Only generate the fragment once (default: `false`)

And **one** of the following as the result:

- **text:** An escaped string to output
- **any:** Any type of content
- **html:** A html string to output **(not sanitised)**
- **template:** A template string to use **(is sanitised)**

**Example:**

```js
customElements.define(
  'my-friends',
  class extends hyperElement {
    FriendCount(user) {
      return {
        once: true,
        placeholder: 'loading your number of friends',
        text: fetch('/user/' + user.userId + '/friends')
          .then((b) => b.json())
          .then((friends) => `you have ${friends.count} friends`)
          .catch((err) => 'problem loading friends'),
      };
    }

    render(Html) {
      const userId = this.attrs.myId;
      Html`<h2> ${{ FriendCount: userId }} </h2>`;
    }
  }
);
```

**Live Example of using an [asynchronous fragment](https://codepen.io/codemeasandwich/pen/MdQrVd)**

---

# Styling

Supports an object as the style attribute. Compatible with React's implementation.

**Example:** of centering an element

```js
render(Html) {
  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
  };
  Html`<div style=${style}> center </div>`;
}
```

**Live Example of [styling](https://codepen.io/codemeasandwich/pen/RmQVKY)**

---

# Connecting to a Data Store

hyper-element integrates with any state management library via `setup()`. The pattern is:

1. Call `attachStore()` with a function that returns your state
2. Subscribe to your store and call the returned function when state changes

## Backbone

```js
var user = new (Backbone.Model.extend({
  defaults: {
    name: 'Guest User',
  },
}))();

customElements.define(
  'my-profile',
  class extends hyperElement {
    setup(attachStore) {
      user.on('change', attachStore(user.toJSON.bind(user)));
      // OR user.on("change", attachStore(() => user.toJSON()));
    }

    render(Html, { name }) {
      Html`Profile: ${name}`;
    }
  }
);
```

## MobX

```js
const user = observable({
  name: 'Guest User',
});

customElements.define(
  'my-profile',
  class extends hyperElement {
    setup(attachStore) {
      mobx.autorun(attachStore(user));
    }

    render(Html, { name }) {
      Html`Profile: ${name}`;
    }
  }
);
```

## Redux

```js
customElements.define(
  'my-profile',
  class extends hyperElement {
    setup(attachStore) {
      store.subscribe(attachStore(store.getState));
    }

    render(Html, { user }) {
      Html`Profile: ${user.name}`;
    }
  }
);
```

---

# Best Practices

## Always Use Html.wire for Lists

When rendering lists, always use `Html.wire()` to ensure proper DOM reuse and prevent XSS vulnerabilities:

```js
// GOOD - Safe and efficient
Html`<ul>${users.map((u) => Html.wire(u, ':item')`<li>${u.name}</li>`)}</ul>`;

// BAD - XSS vulnerability and poor performance
Html`<ul>${users.map((u) => `<li>${u.name}</li>`)}</ul>`;
```

## Dataset Updates Require Assignment

The `dataset` works by reference. To update an attribute you must use **assignment**:

```js
// BAD - mutation doesn't trigger attribute update
this.dataset.user.name = '';

// GOOD - assignment triggers attribute update
this.dataset.user = { name: '' };
```

## Type Coercion Reference

| Source         | Supported Types                |
| -------------- | ------------------------------ |
| `this.attrs`   | Number                         |
| `this.dataset` | Object, Array, Number, Boolean |

## Cleanup Resources in setup()

Always return a cleanup function when using resources that need disposal:

```js
setup(attachStore) {
  const interval = setInterval(attachStore(), 1000);
  return () => clearInterval(interval); // Cleanup on removal
}
```

---

# Development

## Prerequisites

- **Node.js** 20 or higher
- **npm** (comes with Node.js)

## Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/codemeasandwich/hyper-element.git
   cd hyper-element
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

   This also installs the pre-commit hooks automatically via the `prepare` script.

## Available Scripts

| Command               | Description                                       |
| --------------------- | ------------------------------------------------- |
| `npm run build`       | Build minified production bundle with source maps |
| `npm test`            | Run Playwright tests with coverage                |
| `npm run test:ui`     | Run tests with Playwright UI for debugging        |
| `npm run test:headed` | Run tests in headed browser mode                  |
| `npm run kitchensink` | Start local dev server for examples               |
| `npm run lint`        | Run ESLint to check for code issues               |
| `npm run format`      | Check Prettier formatting                         |
| `npm run format:fix`  | Auto-fix Prettier formatting issues               |
| `npm run release`     | Run the release script (maintainers only)         |

## Project Structure

```
hyper-element/
├── src/                     # Source files (ES modules)
│   ├── core/                # Core utilities
│   ├── attributes/          # Attribute handling
│   ├── template/            # Template processing
│   ├── html/                # HTML rendering
│   ├── lifecycle/           # Lifecycle hooks
│   └── hyperElement.js      # Main export
├── build/
│   ├── hyperElement.min.js  # Minified production build
│   └── hyperElement.min.js.map
├── kitchensink/             # Test suite
│   ├── kitchensink.spec.js  # Playwright test runner
│   └── *.html               # Test case files
├── example/                 # Example project
├── docs/                    # Documentation
├── .hooks/                  # Git hooks
│   ├── pre-commit           # Main hook orchestrator
│   ├── commit-msg           # Commit message validator
│   └── pre-commit.d/        # Modular validation scripts
└── scripts/
    └── publish.sh           # Release script
```

## Building

The build process uses [esbuild](https://esbuild.github.io/) for fast, minimal output:

```bash
npm run build
```

This produces:

- `build/hyperElement.min.js` - Minified bundle (~6.2 KB)
- `build/hyperElement.min.js.map` - Source map for debugging

## Pre-commit Hooks

The project uses a modular pre-commit hook system located in `.hooks/`. When you commit, the following checks run automatically:

1. **ESLint** - Code quality checks
2. **Prettier** - Code formatting
3. **Build** - Ensures the build succeeds
4. **Coverage** - Enforces 100% test coverage
5. **JSDoc** - Documentation validation
6. **Docs** - Documentation completeness

If any check fails, the commit is blocked until the issue is fixed.

### Installing Hooks Manually

If hooks weren't installed automatically:

```bash
npm run hooks:install
```

## Code Style

- **Prettier** for formatting (2-space indent, single quotes, trailing commas)
- **ESLint** for code quality
- All files are automatically checked on commit

Run formatting manually:

```bash
npm run format:fix
```

## Testing

See [kitchensink/README.md](kitchensink/README.md) for the full testing guide.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

---

[shadow-dom]: https://developers.google.com/web/fundamentals/web-components/shadowdom
[innerHTML]: https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML
[hyperHTML]: https://viperhtml.js.org/hyper.html
[Custom Elements]: https://developer.mozilla.org/en-US/docs/Web/Web_Components/Custom_Elements
[Test system]: https://jsfiddle.net/codemeasandwich/k25e6ufv/36/
[promise]: https://scotch.io/tutorials/javascript-promises-for-dummies#understanding-promises
