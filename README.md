# hyper-element

Combining the best of [hyperHTML] and [Custom Elements]!

[![npm version](https://badge.fury.io/js/hyper-element.svg)](https://www.npmjs.com/package/hyper-element)
[![CDN link](https://img.shields.io/badge/CDN_link-hyper--element-red.svg)](https://cdn.jsdelivr.net/npm/hyper-element@latest/source/bundle.min.js)
[![gzip size](http://img.badgesize.io/https://cdn.jsdelivr.net/npm/hyper-element@latest/source/bundle.min.js?compression=gzip)](https://cdn.jsdelivr.net/npm/hyper-element@latest/source/bundle.min.js)


Your new custom-element will be rendered with the super fast [hyperHTML] and will react to tag attribute and store changes.

## why hyper-element


* hyper-element is fast & small
    * With only 1 dependency: [hyperHTML]
* With a completely stateless approach, setting and reseting the view is trivial
* Simple yet powerful [Api](#api)
* Built in [template](#templates) system to customise the rendered output
* Inline style objects supported (similar to React)
* First class support for [data stores](#example-of-connecting-to-a-data-store)
* Pass `function` to other custom hyper-elements via there tag attribute

# [Live Demo](https://jsfiddle.net/codemeasandwich/k25e6ufv/)

### If you like it, please [★ it on github](https://github.com/codemeasandwich/hyper-element)

---

- [Define a Custom Element](#define-a-custom-element)
- [Api](#api)
  * [Define your element](#define-your-element)
    + [render](#render)
      + [Html](#html)
      + [Html.wire](#htmlwire)
      + [Html.lite](#htmllite)
    + [setup](#setup)
    + [this](#this)
  * [Advanced attributes](#advanced-attributes)
  * [Templates](#templates)
  * [Fragments](#fragments)
    + [fragment templates](#fragment-templates)
    + [Async fragment templates](#asynchronous-fragment-templates)
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
  }// END render

})// END my-elem
```

If using **webpack**

```
const hyperElement from "hyper-element"
```

To use your element in brower

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/webcomponentsjs@latest/lite.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/hyperhtml@latest/index.js"></script>
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
          ${users.map(user => Html.wire(user,":user_list_item")`<li>${user.name}</li>`)}
      </ul>
    `
```

An **anti-pattern** is to inline the markup as a string

BAD example: ✗

```js
    Html`
      <ul>
          ${users.map(user => `<li>${user.name}</li>`)}
      </ul>
    `
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

The `setup` function wires up an external data-source. This is done with the `onNext` argument that binds a data source to your renderer.

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
}// END setup
```

#### re-rendering without a data source

Example of re-rendering every second

```js
setup(onNext){
    setInterval(onNext(), 1000);
}// END setup
```

#### Set initial values to pass to every render

Example of hard coding an object that will be used on every render

```js
setup(onNext){
    onNext({max_levels:3})
}// END setup
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
setup(onNext){

  const next = onNext(user);

  mobx.autorun(next);       // update when changed (real-time feedback)
  setInterval(next, 1000);  // update every second (update "the time is now ...")

}// END setup

```

---

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
    * ⚠ For performance! The `dataset` works by reference. To update an attribute you must use **assignment** on the `dataset`
        * Bad: `this.dataset.user.name = ""` ✗
        * Good: `this.dataset.user = {name:""}` ✓

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
window.customElements.define("a-user",class extends hyperElement{
  render(Html){
    const onClick = () => this.attrs.hi("Hello from "+this.attrs.name);
    Html`${this.attrs.name} <button onclick=${onClick}>Say hi!</button>`
  }
})

window.customElements.define("users-elem",class extends hyperElement{
  onHi(val){
    console.log("hi was clicked",val)
  }
  render(Html){
    Html`<a-user hi=${this.onHi} name="Beckett" />`
  }
})
```

Output:

```html
<users-elem>
  <a-user update="fn-bgzvylhphgvpwtv" name="Beckett">
     Beckett <button>Say hi!</button>
  </a-user>
</users-elem>
```

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
document.registerElement("my-list",class extends hyperElement{

      render(Html){
        Html`
        ${this.dataset.json.map(user => Html.template(user))}
        `
      }// END render
 })// END my-list
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
* **html:** A html string to output, **(Not sanitised)**
* **template:** A [template](#fragment-templates) string to use, **(Is sanitised)**
    * **values:** A set of values to be used in the **template**

**Example:**

Implementation:

```js
document.registerElement("my-friends",class extends hyperElement{

      FriendCount(user){
        return {

          once:true,

          placeholder: "loading your number of friends",

          text:fetch("/user/"+user.userId+"/friends")
              .then(b => b.json())
              .then(friends => `you have ${friends.count} friends`)
              .catch(err => "problem loading friends")
        }// END return
      }// END FriendCount

      render(Html){
        const userId = this.attrs.myId
        Html`<h2> ${{FriendCount:{userId}}} </h2>`
      }// END render
 })// END my-friends
```

Output:

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

**e.g.** assigning values to template from with in the **fragment function**
* `Foo(values){ return{ template:"<p>{txt}</p>", values:{txt:"Ipsum"} }}`
* with `` Html`${{Foo:{}}}` ``

**or** assigning values to template from with in the **render function**
* `Foo(values){ return{ template:"<p>{txt}</p>" }}`
* with `` Html`${{Foo:{txt:"Ipsum"}}}` ``

*Note: the different is whether or not a "values" is returned from the fragment function*

**output**

`<p>Ipsum</p>`

**Example:**

Implementation:

```js
document.registerElement("click-me",class extends hyperElement{
      Button(){
        return {
          template:`<button type="button" class="btn"
                        onclick={onclick}>{text}</button>`
        }// END return
      }// END Button
      render(Html){
        Html`Try ${{Button:{
                  text:"Click Me",
                  onclick:()=>alert("Hello!")
              }}}`
      }// END render
 })// END click-me
```

Output:

```html
<click-me>
  Try <button type="button" class="btn">Click Me</button>
</click-me>
```

#### Asynchronous fragment templates

You can also return a [promise] as your `template` property.

Rewritting the *my-friends* example

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
        Html`<h2> ${{FriendCount:{userId}}} </h2>`
      }// END render
 }) //END my-friends
```

In this example, the values returned from the promise are used. As the "values" from a fragment function(if provided) takes priority over values passed in from render.

Output:

```html
<my-friends myId="1234">
  <h2> you have 635 friends </h2>
</my-friends>
```


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

# Example of connecting to a data store

## backbone

```js
var user = new (Backbone.Model.extend({
    defaults: {
        name: 'Guest User',
    }
}));//END Backbone.Model.extend


document.registerElement("my-profile", class extends hyperElement{

  setup(onNext){
    user.on("change",onNext(user.toJSON.bind(user)));
    // OR user.on("change",onNext(()=>user.toJSON()));
  }//END setup

  render(Html,{name}){
    Html`Profile: ${name}`
  }//END render
})//END my-profile
```

## mobx

```js
const user = observable({
  name: 'Guest User'
})//END observable


document.registerElement("my-profile", class extends hyperElement{

  setup(onNext){
    mobx.autorun(onNext(user));
  }// END setup

  render(Html,{name}){
    Html`Profile: ${name}`
  }// END render
})//END my-profile
```

## redux

```js
document.registerElement("my-profile", class extends hyperElement{

  setup(onNext){
    store.subcribe(onNext(store.getState)
  }// END setup

  render(Html,{user}){
    Html`Profile: ${user.name}`
  }// END render
})// END my-profile
```
[shadow-dom]:https://developers.google.com/web/fundamentals/web-components/shadowdom
[innerHTML]:https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML
[hyperHTML]:https://viperhtml.js.org/hyper.html
[Custom Elements]:https://developer.mozilla.org/en-US/docs/Web/Web_Components/Custom_Elements
[Test system]:https://jsfiddle.net/codemeasandwich/k25e6ufv/36/
[promise]:https://scotch.io/tutorials/javascript-promises-for-dummies#understanding-promises
