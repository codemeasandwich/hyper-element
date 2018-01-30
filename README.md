# hyper-element

Combining the best of [hyperHTML] and [Custom Elements]!

[![npm version](https://badge.fury.io/js/hyper-element.svg)](https://www.npmjs.com/package/hyper-element)
[![CDN link](https://img.shields.io/badge/CDN_link-hyper--element-red.svg)](https://cdn.jsdelivr.net/npm/hyper-element@latest/source/bundle.min.js)

Your new custom-element will be rendered with the super fast [hyperHTML] and will react to tag attribute and store changes.

## why hyper-element


* hyper-element is fast & small at 6k
    * With only 1 dependency: [hyperHTML]
* With a completely stateless approach, setting and reseting the view is trivial
* Simple yet powerful [Api](#api)
* Built in [template](#templates) system to customise the rendered output
* Inline style objects supported (similar to React)
* First class support for [data stores](#example-of-connecting-to-a-data-store)

# [Live Demo](https://jsfiddle.net/codemeasandwich/k25e6ufv/)

### If you like it, please [★ it on github](https://github.com/codemeasandwich/hyper-element)

---

- [Define a Custom Element](#define-a-custom-element)
- [Api](#api)
  * [Define your element](#define-your-element)
    + [render](#render)
    + [setup](#setup)
    + [this](#this)
  * [Templates](#templates)
  * [Fragments](#fragments)
    + [fragment templates](#fragment-templates)
  * [Render to string](#render-to-string)
  * [Styling](#styling)
- [Connecting to a data store](#example-of-connecting-to-a-data-store)
  * [backbone](#backbone)
  * [mobx](#mobx)
  * [redux](#redux)

---

# Define a custom-element

```js
document.registerElement("my-elem", class extends hyperElement{

  render(Html){
    Html`hello ${this.attrs.who}`
  }

})
```

To use your element

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/webcomponentsjs@latest/lite.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/hyperhtml@latest/min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/hyper-element@latest/source/bundle.min.js"></script>
</head>
<body>
  <my-elem who="world"></my-elem>
</body>
<html>
```

Output

```html
<my-elem who="world">
    hello world
</my-elem>
```

# Api

## Define your element

There are 2 functions. `render` is *required* and `setup` is *optional*

### render

This is what will be displayed with in your element. Use the `Html` to define your content

```js
render(Html,store){

    Html`
      <h1>
          Lasted updated at ${new Date().toLocaleTimeString()}
      </h1>
    `
}
```

### setup

The `setup` function wires up an external data-source. This is done with the `onNext`  argument that binds a data source to your renderer.

#### Connect a data source

Example of re-rendering when the mouse moves. Will pass mouse values to render

```js
// getMouseValues(){ ... }

setup(onNext){

    // the getMouseValues function will be call before each render and pass to render
    const next = onNext(getMouseValues)

    // call next on every mouse event
    onMouseMove(next)

    // cleanup logic
    return ()=>{ console.warn("On remove, do component cleanup here") }
}
```

#### re-rendering without a data source

Example of re-rendering every second

```js
setup(onNext){
    setInterval(onNext(), 1000);
}
```

#### Set initial values to pass to every render

Example of hard coding an object that will be used on every render

```js
setup(onNext){
    onNext({max_levels:3})
}
```

#### How to cleanup

Any logic you wish to run when the **element** is removed from the page should be returned as a function from the `setup` function

```js
// listen to a WebSocket
setup(onNext){

  const next = onNext();
  const ws = new WebSocket("ws://127.0.0.1/data");

  ws.onmessage = ({data}) => next(JSON.parse(data))

  // Return way to unsubscribe
  const teardown = ws.close.bind(ws);
  return teardown
}

render(Html,incomingMessage){
  // ...
}
```

Returning a "teardown function" from `setup` address's the problem of needing a reference to the resource you want to release.

> If the "teardown function" was a public function. We would need to store the reference to the resource somewhere. So the teardown can access it when needed.

With this approach there is no leaking of references.

#### ✎ To subscribe to 2 events

```js
setup(onNext){

  const next = onNext(user);

  mobx.autorun(next);       // update when changed (real-time feedback)
  setInterval(next, 1000);  // update every second (update "the time is now ...")

}

```

### this

* **this.attrs** : the attributes on the tag `<my-elem min="0" max="10" />` = `{ min:0, max:10 }`
    * Casting types supported: `Number`
* **this.store** : the value returned from the store function. *!only updated before each render*
* **this.wrappedContent** : the text content embedded between your tag `<my-elem>Hi!</my-elem>` = `"Hi!"`
* **this.element** : a reference to your created element
* **this.dataset**: this allows reading and writing to all the custom data attributes `data-*` set on the element.
    * Data will be parsed to try and cast them to Javascript types
    * Casting types supported: `Object`, `Array`, `Number` & `Boolean`
    * `dataset` is a **live reflection**. Changes on this object will update matching data attribute on its element.
        * e.g. `<my-elem data-users='["ann","bob"]'></my-elem>` to `this.dataset.users // ["ann","bob"]`
    * ⚠ For performance! The `dataset` works by reference. To update the attribute you must use **assignment**
        * Bad: `this.dataset.user.name = ""` ✗
        * Good: `this.dataset.user = {name:""}` ✓

## Templates

You can declare markup to be used as a template within the custom element

To enable templates:

1. Add an attribute "templates" to your custom element
2. Define the template markup within your element

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
document.registerElement("my-list",class extends hyperElement{

      render(Html){
        Html`
        ${this.dataset.json.map(user => Html.template(user))}
        `
      }
 })
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

## Fragments

Fragments are pieces of content that can be loaded *asynchronously*.

You define one with a class property starting with a **capital letter**.

To use one within your renderer. Pass an object with a property matching the fragment name and any values needed.

The fragment function should return an object with the following properties

* **placeholder:** the placeholder to show while resolving the fragment
* **once:** Only generate the fragment once.
    * Default: `false`. The fragment function will be run on every render!

and **one** of the following as the fragment's result:

* **text:** An escaped string to output  
* **any:** An type of content
* **html:** A html string to output,
* **template:** A [template](#templates) string to output,
    * **values:** A set of values to be used in the **template**

```js
document.registerElement("my-friends",class extends hyperElement{

      FriendCount(user){
        return {

          once:true,

          placeholder: "loading your number of friends",

          text:fetch("/user/"+user.userId+"/friends")
              .then(b => b.json())
              .then(friends => {
                if (friends) return `you have ${friends.count} friends`;
                else return "problem loading friends";
              })
        }
      }

      render(Html){
        const userId = this.attrs.myId
        Html`<h2> ${{FriendCount:{userId}}} </h2>`
      }
 })
```

Ouput:

```html
<my-friends myId="1234">
  <h2> loading your number of friends </h2>
</my-friends>
```
then

```html
<my-friends myId="1234">
  <h2> you have 635 friends </h2>
</my-friends>
```

### fragment templates

You can use the [template](#templates) syntax with in a fragment

* The template will use the values pass to it from the render or using a "values" property to match the template string

**e.g.** `Foo(){return{ template:"<p>{txt}</p>", values:{txt:"Ipsum"} }}` with `` Html`${{Foo:{}}}` ``

**or** `Foo(){return{ template:"<p>{txt}</p>" }}` with `` Html`${{Foo:{txt:"Ipsum"}}}` ``

Example

```js
document.registerElement("click-me",class extends hyperElement{
      Button(){
        return {
          template:`<button type="button" class="btn"
                        onclick={onclick}>{text}</button>`
        }
      }
      render(Html){
        Html`Try ${{Button:{
                  text:"Click Me",
                  onclick:()=>alert("Hello!")
              }}}`
      }
 })
```

Ouput:

```html
<click-me>
  Try <button type="button" class="btn">Click Me</button>
</click-me>
```


## Styling

Supports an object as the style attribute.
Compatible with React's implementation.

Example of centering an element
```js

  render(Html){
    const style= {
      position: "absolute",
      top: "50%", left: "50%",  
      marginRight: "-50%",  
      transform: "translate(-50%, -50%)"
    }
    Html`<div style=${style}> center </div>`
  }

```

# Example of connecting to a data store

## backbone

```js
var user = new (Backbone.Model.extend({
    defaults: {
        name: 'Guest User',
    }
}));


document.registerElement("my-profile", class extends hyperElement{

  setup(onNext){
    user.on("change",onNext(user.toJSON.bind(user)));
    // OR user.on("change",onNext(()=>user.toJSON()));
  }

  render(Html,{name}){
    Html`Profile: ${name}`
  }
})
```

## mobx

```js
const user = observable({
  name: 'Guest User'
})


document.registerElement("my-profile", class extends hyperElement{

  setup(onNext){
    mobx.autorun(onNext(user));
  }

  render(Html,{name}){
    Html`Profile: ${name}`
  }
})
```

## redux

```js
document.registerElement("my-profile", class extends hyperElement{

  setup(onNext){
    store.subcribe(onNext(store.getState)
  }

  render(Html,{user}){
    Html`Profile: ${user.name}`
  }
})
```
[shadow-dom]:https://developers.google.com/web/fundamentals/web-components/shadowdom
[innerHTML]:https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML
[hyperHTML]:https://viperhtml.js.org/hyper.html
[Custom Elements]:https://developer.mozilla.org/en-US/docs/Web/Web_Components/Custom_Elements
[Test system]:https://jsfiddle.net/codemeasandwich/k25e6ufv/36/
