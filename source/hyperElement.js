'use strict';

(function (factory) {

    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
        //define(['mobx'], factory);
    } else if (typeof exports === 'object') {
        // Node, CommonJS-like
        module.exports = factory();
        //module.exports = factory(require('mobx'));
    } else {
        //window.hyperElement = factory(window.mobx);
        window.hyperElement = factory();
    }

}(function () {

  class hyperElement extends HTMLElement{

    bindLocalFn(){
      Object.getOwnPropertyNames(this.__proto__)
            .filter(name => ! (
              "constructor" === name ||
              "readStore"   === name ||
              "watch"       === name ||
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

     const store = this.readStore || (()=>{});

     const render = this.render

     this.render = ()=>{
       this.store = store()
       render.call(this,Html,this.store);
     }
     this.render()

     if(this.watch){
       const autoRunMeOnChange = this.watch()
       autoRunMeOnChange(this.render)
     }

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
