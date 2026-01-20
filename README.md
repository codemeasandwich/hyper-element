# hyper-element

Combining the best of [hyperHTML] and [Custom Elements]!

[![npm version](https://img.shields.io/npm/v/hyper-element.svg)](https://www.npmjs.com/package/hyper-element)
[![npm package size](https://img.shields.io/bundlephobia/minzip/hyper-element)](https://bundlephobia.com/package/hyper-element)
[![ES6+](https://img.shields.io/badge/ES6+-supported-blue.svg)](https://caniuse.com/es6)

Your new custom-element will be rendered with the super fast [hyperHTML] and will react to tag attribute and store changes.

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

## why hyper-element

- hyper-element is fast & small
  - With only 1 dependency: [hyperHTML]
- With a completely stateless approach, setting and reseting the view is trivial
- Simple yet powerful [Api](#api)
- Built in [template](#templates) system to customise the rendered output
- Inline style objects supported (similar to React)
- First class support for [data stores](#example-of-connecting-to-a-data-store)
- Pass `function` to other custom hyper-elements via there tag attribute

# [Live Demo](https://jsfiddle.net/codemeasandwich/k25e6ufv/)

### If you like it, please [★ it on github](https://github.com/codemeasandwich/hyper-element)

---

- [Define a Custom Element](#define-a-custom-element)
- [Api](#api)
  - [Define your element](#define-your-element)
    - [render](#render)
      - [Html](#html)
      - [Html.wire](#htmlwire)
      - [Html.lite](#htmllite)
    - [setup](#setup)
    - [this](#this)
  - [Advanced attributes](#advanced-attributes)
  - [Templates](#templates)
  - [Fragments](#fragments)
    - [fragment templates](#fragment-templates)
    - [Async fragment templates](#asynchronous-fragment-templates)
  - [Styling](#styling)
- [Connecting to a data store](#example-of-connecting-to-a-data-store)
  - [backbone](#backbone)
  - [mobx](#mobx)
  - [redux](#redux)

---

# Define a custom-element

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://cdn.jsdelivr.net/npm/hyperhtml@latest/index.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/hyper-element@latest/source/bundle.min.js"></script>
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

# Api

## Define your element

There are 2 functions. `render` is _required_ and `setup` is _optional_

### render

This is what will be displayed with in your element. Use the `Html` to define your content

#### Html

The primary operation is to describe the complete inner content of the element.

```js
render(Html,store){

    Html`
      <h1>
          Lasted updated at ${new Date().toLocaleTimeString()}
      </h1>
    `
}// END render
```

The `Html` has a primary operation and two utilities: `.wire` & `.lite`

---

#### Html.wire

The `.wire` is for creating reusable sub-element

The wire can take two arguments `Html.wire(obj,id)`

1. a refrive object to match with the create node. Allowing for reuse of the exiting node.
2. a string to identify the markup used. Allowing the markup template to be generated only once.

Example of displaying a list of users from an array

```js
Html`
      <ul>
          ${users.map((user) => Html.wire(user, ':user_list_item')`<li>${user.name}</li>`)}
      </ul>
    `;
```

An **anti-pattern** is to inline the markup as a string

BAD example: ✗

```js
Html`
      <ul>
          ${users.map((user) => `<li>${user.name}</li>`)}
      </ul>
    `;
```

This will create a new node for every element on every render. The is have a **Negative impact on performance** and output will **Not be sanitized**. So DONT do this!

---

#### Html.lite

The `.lite` is for creating once off sub-element

Example of wrapping the [jQuary date picker](https://jqueryui.com/datepicker/)

```js

onSelect(dateText, inst){
  console.log("selected time "+dateText)
} // END onSelect

Date(lite){
  const inputElem = lite`<input type="text"/>`
  $(inputElem).datepicker({onSelect:this.onSelect});
  return {
    any: inputElem,
    once:true
  }
} // END Date

render(Html){
  Html` Pick a date ${{Date:Html.lite}} `
} // END render

```

---

### setup

The `setup` function wires up an external data-source. This is done with the `attachStore` argument that binds a data source to your renderer.

#### Connect a data source

Example of re-rendering when the mouse moves. Will pass mouse values to render

```js
// getMouseValues(){ ... }

setup(attachStore){

    // the getMouseValues function will be call before each render and pass to render
    const onStoreChange = attachStore(getMouseValues)

    // call next on every mouse event
    onMouseMove(onStoreChange)

    // cleanup logic
    return ()=> console.warn("On remove, do component cleanup here")
}// END setup
```

**Live Example of [attach a store](https://codepen.io/codemeasandwich/pen/VOQWeN)**

#### re-rendering without a data source

Example of re-rendering every second

```js
setup(attachStore){
    setInterval(attachStore(), 1000);
}// END setup
```

#### Event callbacks from external sources

Use `attachStore()` without arguments to get a trigger function for external events:

```js
// External event system
const callbacks = [];
function onMessage(cb) {
  callbacks.push(cb);
}
function emitMessage(msg) {
  callbacks.forEach((cb) => cb(msg));
}

// Element definition
customElements.define(
  'chat-messages',
  class extends hyperElement {
    messages = [];

    setup(attachStore) {
      const triggerRender = attachStore(); // No state function needed

      onMessage((msg) => {
        this.messages.push(msg);
        triggerRender(); // Re-renders with updated this.messages
      });
    }

    render(Html) {
      Html`<ul>${this.messages.map((m) => Html.wire(m, ':msg')`<li>${m}</li>`)}</ul>`;
    }
  }
);
```

#### Set initial values to pass to every render

Example of hard coding an object that will be used on **every** render

```js
setup(attachStore){
    attachStore({max_levels:3})
}// END setup
```

#### How to cleanup

Any logic you wish to run when the **element** is removed from the page should be returned as a function from the `setup` function

```js
// listen to a WebSocket
setup(attachStore){

  let newSocketValue;
  const onStoreChange = attachStore(()=> newSocketValue);
  const ws = new WebSocket("ws://127.0.0.1/data");

  ws.onmessage = ({data}) => {
    newSocketValue = JSON.parse(data);
    onStoreChange()
  }

  // Return way to unsubscribe
  return ws.close.bind(ws)
}// END setup

render(Html,incomingMessage){
  // ...
}// END render
```

Returning a "teardown function" from `setup` address's the problem of needing a reference to the resource you want to release.

> If the "teardown function" was a public function. We would need to store the reference to the resource somewhere. So the teardown can access it when needed.

With this approach there is no leaking of references.

#### ✎ To subscribe to 2 events

```js
setup(attachStore){

  const onStoreChange = attachStore(user);

  mobx.autorun(onStoreChange);       // update when changed (real-time feedback)
  setInterval(onStoreChange, 1000);  // update every second (update "the time is now ...")

}// END setup

```

---

### this

- **this.attrs** : the attributes on the tag `<my-elem min="0" max="10" />` = `{ min:0, max:10 }`
  - Casting types supported: `Number`
- **this.store** : the value returned from the store function. _!only updated before each render_
- **this.wrappedContent** : the text content embedded between your tag `<my-elem>Hi!</my-elem>` = `"Hi!"`
- **this.element** : a reference to your created element
- **this.dataset**: this allows reading and writing to all the custom data attributes `data-*` set on the element.
  - Data will be parsed to try and cast them to Javascript types
  - Casting types supported: `Object`, `Array`, `Number` & `Boolean`
  - `dataset` is a **live reflection**. Changes on this object will update matching data attribute on its element.
    - e.g. `<my-elem data-users='["ann","bob"]'></my-elem>` to `this.dataset.users // ["ann","bob"]`
  - ⚠ For performance! The `dataset` works by reference. To update an attribute you must use **assignment** on the `dataset`
    - Bad: `this.dataset.user.name = ""` ✗
    - Good: `this.dataset.user = {name:""}` ✓

---

## Advanced attributes

### Dynamic attributes with custom-element children

Being able to set attributes at run-time should be the same for dealing with a native element and ones defined by hyper-element.

**⚠ To support dynamic attributes on custom elements YOU MUST USE `customElements.define` which requires native ES6 support! Use the native source `/source/hyperElement.js` NOT `/source/bundle.js`**

This is what allows for the passing any dynamic attributes from parent to child custom element! You can also pass a `function` to a child element(that extends hyperElement).

**Example:**

In you document:

```html
<script src="https://cdn.jsdelivr.net/npm/hyper-element@latest/source/hyperElement.js"></script>
<users-elem />
```

Implementation:

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

Output:

```html
<users-elem>
  <a-user update="fn-bgzvylhphgvpwtv" name="Beckett">
    Beckett <button>Say hi!</button>
  </a-user>
</users-elem>
```

**Live Example of passing an [onclick to a child element](https://codepen.io/codemeasandwich/pen/rgdvPX)**

## Templates

You can declare markup to be used as a template within the custom element

To enable templates:

1. Add an attribute "templates" to your custom element
2. Define the template markup within your element

**Example:**

In you document:

```Html
<my-list template data-json='[{"name":"ann","url":""},{"name":"bob","url":""}]' >
  <div>
    <a href="{url}">{name}</a>
  </div>
</my-list>
```

Implementation:

```js
document.registerElement(
  'my-list',
  class extends hyperElement {
    render(Html) {
      Html`
        ${this.dataset.json.map((user) => Html.template(user))}
        `;
    } // END render
  }
); // END my-list
```

Output:

```Html
<my-list template data-json='[{"name":"ann","url":""},{"name":"bob","url":""}]' >
    <div>
      <a href="">ann</a>
    </div>
    <div>
      <a href="">bob</a>
    </div>
</my-list>
```

**Live Example of using a [templatets](https://codepen.io/codemeasandwich/pen/LoQLrK)**

### Advanced Template Features

Templates support handlebars-like conditionals and iteration:

#### Conditionals: {#if}

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

#### Negation: {#unless}

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

#### Iteration: {#each}

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

**Special variables in {#each}:**

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

## Fragments

Fragments are pieces of content that can be loaded _asynchronously_.

You define one with a class property starting with a **capital letter**.

To use one within your renderer. Pass an object with a property matching the fragment name and any values needed.

The fragment function should return an object with the following properties

- **placeholder:** the placeholder to show while resolving the fragment
- **once:** Only generate the fragment once.
  - Default: `false`. The fragment function will be run on every render!

and **one** of the following as the fragment's result:

- **text:** An escaped string to output
- **any:** An type of content
- **html:** A html string to output, **(Not sanitised)**
- **template:** A [template](#fragment-templates) string to use, **(Is sanitised)**
  - **values:** A set of values to be used in the **template**

**Example:**

Implementation:

```js
document.registerElement(
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
      }; // END return
    } // END FriendCount

    render(Html) {
      const userId = this.attrs.myId;
      Html`<h2> ${{ FriendCount: userId }} </h2>`;
    } // END render
  }
); // END my-friends
```

Output:

```html
<my-friends myId="1234">
  <h2>loading your number of friends</h2>
</my-friends>
```

then

```html
<my-friends myId="1234">
  <h2>you have 635 friends</h2>
</my-friends>
```

### fragment templates

You can use the [template](#templates) syntax with in a fragment

- The template will use the values pass to it from the render or using a "values" property to match the template string

**e.g.** assigning values to template from with in the **fragment function**

- `Foo(values){ return{ template:"<p>{txt}</p>", values:{txt:"Ipsum"} }}`
- with `` Html`${{Foo:{}}}` ``

**or** assigning values to template from with in the **render function**

- `Foo(values){ return{ template:"<p>{txt}</p>" }}`
- with `` Html`${{Foo:{txt:"Ipsum"}}}` ``

_Note: the different is whether or not a "values" is returned from the fragment function_

**output**

`<p>Ipsum</p>`

**Example:**

Implementation:

```js
document.registerElement(
  'click-me',
  class extends hyperElement {
    Button() {
      return {
        template: `<button type="button" class="btn"
                        onclick={onclick}>{text}</button>`,
      }; // END return
    } // END Button
    render(Html) {
      Html`Try ${{
        Button: {
          text: 'Click Me',
          onclick: () => alert('Hello!'),
        },
      }}`;
    } // END render
  }
); // END click-me
```

Output:

```html
<click-me> Try <button type="button" class="btn">Click Me</button> </click-me>
```

#### Asynchronous fragment templates

You can also return a [promise] as your `template` property.

Rewritting the _my-friends_ example

**Example:**

Implementation:

```js
document.registerElement("my-friends",class extends hyperElement{

      FriendCount(user){

        const templatePromise = fetch("/user/"+user.userId+"/friends")
                                  .then(b => b.json())
                                  .then(friends => ({
                                          template:`you have {count} friends`,
                                          values:{count:friends.count}
                                        })
                                  }) // END .then
                                  .catch(err=>({ template:`problem loading friends` })

        return {
          once: true,
          placeholder: "loading your number of friends",
          template: templatePromise
        } // END return
      }// END FriendCount

      render(Html){
        const userId = this.attrs.myId
        Html`<h2> ${{FriendCount:userId}} </h2>`
      }// END render
 }) //END my-friends
```

In this example, the values returned from the promise are used. As the "values" from a fragment function(if provided) takes priority over values passed in from render.

Output:

```html
<my-friends myId="1234">
  <h2>you have 635 friends</h2>
</my-friends>
```

**Live Example of using a [asynchronous fragment](https://codepen.io/codemeasandwich/pen/MdQrVd)**

## Styling

Supports an object as the style attribute. Compatible with React's implementation.

**Example:** of centering an element

```js

  render(Html){
    const style= {
      position: "absolute",
      top: "50%", left: "50%",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)"
    }//END style
    Html`<div style=${style}> center </div>`
  }//END render

```

**Live Example of [styling](https://codepen.io/codemeasandwich/pen/RmQVKY)**

# Example of connecting to a data store

## backbone

```js
var user = new (Backbone.Model.extend({
  defaults: {
    name: 'Guest User',
  },
}))(); //END Backbone.Model.extend

document.registerElement(
  'my-profile',
  class extends hyperElement {
    setup(attachStore) {
      user.on('change', attachStore(user.toJSON.bind(user)));
      // OR user.on("change",attachStore(()=>user.toJSON()));
    } //END setup

    render(Html, { name }) {
      Html`Profile: ${name}`;
    } //END render
  }
); //END my-profile
```

## mobx

```js
const user = observable({
  name: 'Guest User',
}); //END observable

document.registerElement(
  'my-profile',
  class extends hyperElement {
    setup(attachStore) {
      mobx.autorun(attachStore(user));
    } // END setup

    render(Html, { name }) {
      Html`Profile: ${name}`;
    } // END render
  }
); //END my-profile
```

## redux

```js
document.registerElement("my-profile", class extends hyperElement{

  setup(attachStore){
    store.subcribe(attachStore(store.getState)
  }// END setup

  render(Html,{user}){
    Html`Profile: ${user.name}`
  }// END render
})// END my-profile
```

[shadow-dom]: https://developers.google.com/web/fundamentals/web-components/shadowdom
[innerHTML]: https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML
[hyperHTML]: https://viperhtml.js.org/hyper.html
[Custom Elements]: https://developer.mozilla.org/en-US/docs/Web/Web_Components/Custom_Elements
[Test system]: https://jsfiddle.net/codemeasandwich/k25e6ufv/36/
[promise]: https://scotch.io/tutorials/javascript-promises-for-dummies#understanding-promises
