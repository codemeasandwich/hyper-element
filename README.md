# hyper-element

A combining the best of [hyperHTML] and [Custom Elements]!

[![npm version](https://badge.fury.io/js/hyper-element.svg)](https://www.npmjs.com/package/hyper-element)
[![CDN link](https://img.shields.io/badge/CDN_link-hyper--element-red.svg)](https://unpkg.com/hyper-element@latest/source/bundle.js)

Your new custom-elements are built with [hyperHTML] and will be re-rendered on attribute and store change.

## why hyper-element


* hyper-element is built on ECMAScript & DOM standards
    * With only 1 dependency: The super fast renderer [hyperHTML]
* With a completely stateless approach, setting and reseting the view is trivial
* Simple with a powerful [Api](#api)
* Built in [template](#templates) system to define markup fragments
* Inline style objects supported (similar to React)
* First class support for [data stores](#example-of-connecting-to-a-data-store)
* Small: under 3k (minify + gzip)

# [Live Demo](https://jsfiddle.net/codemeasandwich/k25e6ufv/)

---

- [Define a Custom Element](#define-a-custom-element)
- [Api](#api)
  * [Define your element](#define-your-element)
    + [render](#render)
    + [setup](#setup)
    + [this](#this)
  * [Templates](#templates)
  * [Fragments](#fragments)
  * [Render to string](#render-to-string)
  * [Styling](#styling)
- [Connecting to a data store](#example-of-connecting-to-a-data-store)
  * [backbone](#backbone)
  * [mobx](#mobx)
  * [redux](#redux)

---

# Define a Custom Element

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
  <script src="https://unpkg.com/hyperhtml@latest/min.js"></script>
  <script src="https://unpkg.com/hyper-element@latest/source/bundle.js"></script>
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

#### Connent a data source

Example to re-rendering when the mouse moves and pass current mouse values to render

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

#### re-rendering with out a data source

Example of re-rendering every second

```js
setup(onNext){
    setInterval(onNext(), 1000);
}
```

#### Set initial values to pass to every render

Example of attaching an object, that will be used on every render

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
  const ws = new WebSocket("ws://127.0.0.1:58000/data");

  ws.onmessage = ({data}) => next(JSON.parse(data))

  // Return way to unsubscribe
  const teardown = ws.close.bind(ws);
  return teardown
}
```

Returning a "teardown function" from `setup` address the problem of needing a reference to the resource you what to release. If the "teardown function" was a public function. We would need to store the reference to the resource some, that the teardown can access it when call.

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

* this.attrs : the attributes on the tage `<my-elem min="0" max="10" />` = `{ min:0, max:10 }`
    * Attributes will be parsed to try and cast them to Javascript types
    * Casting types supported: `Boolean` & `Number`
* this.store : the value returned from the store function. *!only update before each render*
* this.wrappedContent : the text content embedded between your tag `<my-elem>Hi!</my-elem>` = `"Hi!"`


## Templates

You can declare markup to be used as a template within the custom element

To enable templates:

1. Add an attribute "templates" to your custom element
2. Define the template markup within your element

```Html
<my-list template data-json='[{"name":"ann","url":""},{"name":"bob","url":""}]' >
<div><a href="{url}">{name}</a></div>
</my-list>
```

```js
document.registerElement("my-list",class extends hyperElement{

      render(Html){
        Html`
        ${this.attrs["data-json"].map(user => Html.template(user))}
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

For better performance, you can pass an identifier as the 2nd value to template

```js
Html.template(user,user.id)
```

***Under the hood***

*Using an "identifier" is ideal if you are making any changes to the order of the array. This allows the render to inject & remove elements in the element list without rebuilding the list from the first changed index on, which would happen otherwise.*

## Fragments

Fragments are pieces of content that can be loaded *asynchronously*. An class property defined with a **capital letter** will be treated as a fragment.

**⚠ Note that the fragment function will be run on every render!**

The fragment function should return an object with the following properties

* **placeholder:** the placeholder to show while resolving the fragment

and **one** of the following as the fragment's result:

* **text:** An escaped string to output  
* **any:** An type of content
* **html:** A html string to output,

```js
document.registerElement("my-list",class extends hyperElement{

      FriendCount(user){
        return {

          placeholder: "loading your number of friends",

          text:fetch("/user/friends")
              .then(b => b.json())
              .then(friends => {
                if (friends) return `you have ${friends.count} friends`;
                else return "problem loading friends";
              })
        }
      }

      render(Html){
        Html`<h2> ${{FriendCount:{userId:1234}}} </h2>`
      }
 })
```

## Render to string

You can use the `innerShadow` property to get the [innerHTML] of the [shadow-dom]

```js
// create an element
const elem = document.createElement("profile-elem")
      elem.setAttribute('name', 'ashlyn');

// view hidden markup
console.log(elem,elem.innerShadow)
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
