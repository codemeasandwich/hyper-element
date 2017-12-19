'use strict';

(function (factory) {

    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['hyperhtml'], factory);
    } else if (typeof exports === 'object') {
        // Node, CommonJS-like
        module.exports = factory(require('npm install hyperhtml'));
    } else {
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
      this.bindLocalFn()
    }

    connectedCallback() {
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

     const Html = this.Html = hyperHTML.bind(this.attachShadow({mode: 'closed'}));
     Html.wire = hyperHTML.wire
     Html.lite = hyperHTML
     if(this.props){
       throw new Error("'props' is defined!!")
     }
     this.props = this.attachProps(this.attributes);

     this.render = this.render.bind(this,Html)

     if(this.setup)
     this.setup(onNext.bind(this))
     this.render()
    }

    detachedCallback(){
      this.disposer && this.disposer()
    }

    attributeChangedCallback(name,oldVal,newVal){
      this.props[name] = newVal;
      this.render();
    }

    disconnectedCallback(){
    }
  }

  return hyperElement;

}));
