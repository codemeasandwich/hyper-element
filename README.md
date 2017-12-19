# hyper-element

A combining the best of [hyperHTML] and [Custom Elements]!

You custom-elements is build with hyperHTML and will be re-rendered on attribute and store change.

To define a Custom Element

```js
document.registerElement("my-elem", class extends hyperElement{

  render(Html){
    Html`hello world`
  }

})
```

To use your Custom Element

```html
<my-elem/>
```

# Api

## funtions

There are 2 functions. `render` is *required* and `setup` is *optional*

### render

This is what will be displayed with in your element

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

The `setup` function wires up an external data-set

#### Only a data source and re-rendering on event

Example to re-rendering when the mouse moves and get the current values

```js
/// getMouseValues(){ ... }

setup(onNext){
    onMouseMove(onNext(getMouseValues))
}
```

#### Only re-rendering

Example of re-rendering every second

```js
setup(onNext){
    setInterval(onNext(), 1000);
}
```

#### Only bind some data

Example of attach an object that will be used on evey render

```js
setup(onNext){
    onNext({max_levels:3})
}
```


## this

* this.props : the attribute on the tage `<my-elem min="0" max="10" />`
* this.store : the value returned from the store function. !only update before each render
* this.textContent : the content between the tags `<my-elem>Hi!</my-elem>`


# Example

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

[hyperHTML]:https://viperhtml.js.org/hyper.html
[Custom Elements]:https://developer.mozilla.org/en-US/docs/Web/Web_Components/Custom_Elements
