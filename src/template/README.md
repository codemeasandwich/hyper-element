# src/template/

Template compilation for hyper-element.

## Overview

This module compiles innerHTML templates into reusable template functions. Supports:

- Simple `{var}` interpolation
- Block syntax: `{+each}`, `{+if}`, `{+unless}`
- Special variable: `{@}` (loop index)

## Basic Template Syntax

```html
<!-- Simple interpolation -->
<div>{name}</div>

<!-- Each loop -->
{+each items}
<li>{name}</li>
{-each}

<!-- Conditionals -->
{+if show}
<p>Visible</p>
{else}
<p>Hidden</p>
{-if} {+unless hidden}
<p>Shown</p>
{-unless}
```

## Using Templates

To enable templates:

1. Add a `template` attribute to your custom element
2. Define the template markup within your element

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

## Advanced Template Features

### Conditionals: {+if}

Show content based on a condition:

```html
<status-elem template>{+if active}Online{else}Offline{-if}</status-elem>
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

### Negation: {+unless}

Show content when condition is falsy (opposite of +if):

```html
<warning-elem template>{+unless valid}Invalid input!{-unless}</warning-elem>
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

### Iteration: {+each}

Loop over arrays:

```html
<list-elem template>
  <ul>
    {+each items}
    <li>{name}</li>
    {-each}
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

### Special Variables in {+each}

- `{...}` or `{ ... }` - Current item value (formatted: primitives escaped, arrays join(","), objects JSON, functions called)
- `{@}` - The current index (0-based)

```html
<nums-elem template>{+each numbers}{@}: {number}, {-each}</nums-elem>
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

## Live Examples

- [Templates demo](https://codepen.io/codemeasandwich/pen/LoQLrK)
