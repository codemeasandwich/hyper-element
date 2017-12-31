'use strict';

(function (factory) {

    if (typeof exports === 'object') {        
        // Node, CommonJS-like
        module.exports = factory(require('hyperhtml/cjs'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(['hyperhtml'], factory);
    }  else {
        window.hyperElement = factory(window.hyperHTML);
    }

}(function (hyperHTML) {

  function onNext(store){

      const storeFn = ("function" == typeof store) ? store : ()=> store

      const render = this.render

      this.render = ()=>{
        this.store = storeFn();
        render(this.store)
      }

      return this.render;
  }

  class hyperElement extends HTMLElement{

    bindLocalFn(){
      Object.getOwnPropertyNames(this.__proto__)
            .filter(name => ! (
              "constructor" === name ||
              "setup"       === name ||
              "render"      === name
            ))
            .forEach( name => this[name] = this[name].bind(this) )
    }

    createdCallback(){
        // an instance of the element is created
    
      this.bindLocalFn()
                                                       // use shadow DOM, else fallback to render to element
     const Html = this.Html = hyperHTML.bind(this.attachShadow ? this.attachShadow({mode: 'closed'}) : this);
     Html.wire = hyperHTML.wire
     Html.lite = hyperHTML
     if(this.props){
       throw new Error("'props' is defined!!")
     }
     this.props = this.attachProps(this.attributes) || {};

     this.render = this.render.bind(this,Html)

     if(this.setup)
     this.teardown = this.setup(onNext.bind(this))
     this.render()
    }

    connectedCallback() {
      // Called when the element is inserted into a document, including into a shadow tree
    }

    attachProps(attributes){
      const accumulator = {};
      for (let i = 0; i < attributes.length; i++) {
         const value = attributes[i].value;
         const name  = attributes[i].name;

         accumulator[name] = value;
     }
     return accumulator;
    }

    attachedCallback(){
        //an instance was inserted into the document
    }

    detachedCallback(){
      this.disposer && this.disposer()
      this.disconnectedCallback()
    }

    attributeChangedCallback(name,oldVal,newVal){
      this.props[name] = newVal;
      this.render();
    }

    disconnectedCallback(){
      this.teardown && this.teardown()
      this.teardown = null
      //Called when the element is removed from a document
    }
  }

  return hyperElement;

}));

