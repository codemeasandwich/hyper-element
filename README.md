# hyper-element

A combining the best of [hyperHTML] and [Custom Elements]!

[![npm version](https://badge.fury.io/js/hyper-element.svg)](https://www.npmjs.com/package/hyper-element)
[![CDN link](https://img.shields.io/badge/CDN_link-hyper--element-red.svg)](https://unpkg.com/hyper-element@latest/source/bundle.js)

Your new custom-elements are built with [hyperHTML] and will be re-rendered on attribute and store change.

# [Live Demo](https://jsfiddle.net/codemeasandwich/k25e6ufv/)

---

- [Define a Custom Element](#define-a-custom-element)
- [Api](#api)
  * [Define your element](#define-your-element)
    + [render](#render)
    + [setup](#setup)
    + [this](#this)
  * [Templates](#templates)
  * [Render to string](#render-to-string)
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
  <my-elem who="world"/>
</body>
<html>
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

The `setup` function wires up an external data-source

#### Connent a data source

Example to re-rendering when the mouse moves and pass current mouse values to render

```js
// getMouseValues(){ ... }

setup(onNext){
    onMouseMove(onNext(getMouseValues))
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

Example of attach an object that will be used on evey render

```js
setup(onNext){
    onNext({max_levels:3})
}
```

#### How to cleanup

Any logic you wish to run when the **element** is removed from the page should be returned as a function from the `setup` call

```js
setup(onNext){
   const next = onNext(user);
   socket.addEventListener('message', next);
   const teardown = function(){
     socket.removeEventListener('message', next);
   }
   return teardown
}
```

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
* this.store : the value returned from the store function. !only update before each render
* this.wrapedContent : the content between the tags `<my-elem>Hi!</my-elem>`


## Templates

You can declare markup to be used as a template within the custom element

To enable templates

1. Add an attribute "templates" to you custom element
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

## Render to string

You can use the `innerShadow` property to get the [innerHTML] of the [shadow-dom]

```js
// create an element
const elem = document.createElement("profile-elem")
      elem.setAttribute('name', 'ashlyn');

// view hidden markup
console.log(elem,elem.innerShadow)
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
