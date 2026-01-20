# src/lifecycle/

Lifecycle management for hyper-element instances.

## Overview

This module handles the custom element lifecycle:

- `connectedCallback` initialization (attributes, dataset, observers, render)
- MutationObserver for content and attribute changes
- Store-based reactive updates via `onNext`

## Lifecycle Flow

1. Element connected to DOM
2. Unique identifier created
3. MutationObserver attached
4. Fragment methods defined
5. Attributes and dataset attached
6. `setup()` called (if defined)
7. Initial `render()` called

## Store Integration

The `setup()` function wires up external data sources using the `attachStore` argument that binds a data source to your renderer.

### Connect a Data Source

```js
setup(attachStore) {
  // getMouseValues function called before each render
  const onStoreChange = attachStore(getMouseValues);

  // call onStoreChange on every mouse event
  onMouseMove(onStoreChange);

  // cleanup logic
  return () => console.warn('On remove, do component cleanup here');
}
```

### Re-rendering Without a Data Source

```js
setup(attachStore) {
  setInterval(attachStore(), 1000); // re-render every second
}
```

### Set Initial Values

```js
setup(attachStore) {
  attachStore({ max_levels: 3 }); // passed to every render
}
```

### Cleanup on Removal

Return a function from `setup` to run cleanup when the element is removed:

```js
setup(attachStore) {
  let newSocketValue;
  const onStoreChange = attachStore(() => newSocketValue);
  const ws = new WebSocket('ws://127.0.0.1/data');

  ws.onmessage = ({ data }) => {
    newSocketValue = JSON.parse(data);
    onStoreChange();
  };

  // Return way to unsubscribe
  return ws.close.bind(ws);
}
```

## Data Store Examples

### Backbone

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

### MobX

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

### Redux

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

### Multiple Subscriptions

```js
setup(attachStore) {
  const onStoreChange = attachStore(user);

  mobx.autorun(onStoreChange); // update when changed (real-time feedback)
  setInterval(onStoreChange, 1000); // update every second (update "the time is now ...")
}
```

## Live Examples

- [Attach a store](https://codepen.io/codemeasandwich/pen/VOQWeN)
