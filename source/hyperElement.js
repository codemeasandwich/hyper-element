
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

  const manager = {   }

//=====================================================
//=========================== re-render on store change
//=====================================================

  function onNext(that,store){

      const storeFn = ("function" == typeof store) ? store : () => store

      const render = this.render

       const render2 = (...data)=>{

        if(undefined === store){
          that.store = undefined;
          render(...data)
        } else {
          that.store = storeFn()
          render(that.store,...data)
        }
      }
       this.render = render2;

      return render2;
  }

//=====================================================
//======================== Observer change to innerHTML
//=====================================================

  function observer(ref){
   const that = ref.this
    const mutationObserver = new MutationObserver((mutations)=> {
    /*
//if(!this.textContent){
const mutation = mutations[mutations.length - 1]
const addedNodes = mutation.addedNodes[0]
console.log(this,addedNodes,ref.observe)
//}
*/
        let textContent = this.textContent
/*
				//if("" === textContent){
        //  const mutation = mutations[mutations.length - 1]
         // const addedNodes = mutation.addedNodes[0]
          if(addedNodes)
          textContent = addedNodes.data
       // }

console.log(textContent === this.wrapedConten,"TEXT_CONTENT:",textContent, "WRAPED_CONTENT:",this.wrappedContent)
      */

      if(!ref.observe) return;

      ref.innerHTML = this.innerHTML
        // that.wrappedContent = textContent
			if(that.attrs.template){
      //this.attachAttrs(this.attributes)
      that.attrs = this.attachAttrs(this.attributes) || {};
      }

        //reset the element
        hyperHTML.bind(ref.shadow)`` // HACK, dont know why this works?

        that.wrappedContent = textContent
        this.render()
    });

    mutationObserver.observe(this, {
        // Set to true if mutations to target's attributes are to be observed.
        //attributes: true,

        // Set to true if mutations to target's data are to be observed.
       // characterData: true, // re-render on content change

        // Set to true if additions and removals of the target node's child elements (including text nodes) are to be observed.
        childList: true,

        // Set to true if mutations to target and target's descendants are to be observed.
        subtree: true,

        // Set to true if attributes is set to true and target's attribute value before the mutation needs to be recorded.
        //attributeOldValue: true,

        // Set to true if characterData is set to true and target's data before the mutation needs to be recorded.
        //characterDataOldValue: true
    });
  }

  function parceAttribute(key,value){
    if("template" === key && "" === value){
      return true
    }

    if((+value)+"" === value.trim()){
      return +value; // to number
    }

    const lowerCaseValue = value.toLowerCase().trim()

    if("true" === lowerCaseValue){
      return true
    } else if("false" === lowerCaseValue){
      return false
    } // END boolean check

    //if("data-json"===key){
    if(lowerCaseValue[0] === "[" && lowerCaseValue.slice(-1) === "]"
    || lowerCaseValue[0] === "{" && lowerCaseValue.slice(-1) === "}"){
      return JSON.parse(value)
    }

    return value
  } // END parceAttribute

//=====================================================
//======================================= All the magic
//=====================================================

  class hyperElement extends HTMLElement{

//++++++++++++++++++++++++++++++++ get element content
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    get innerShadow(){
      return manager[this.identifier].shadow.innerHTML
    }

//++++++++++++++++++++++++++++++++++++++++++++++ Setup
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    createdCallback(){

      // an instance of the element is created
      this.identifier = Symbol(this.localName);
    const ref = manager[this.identifier] = {attrsToIgnore:{}}
      ref.innerHTML = this.innerHTML
      const that = ref.this = {element:this}
       that.wrappedContent = this.textContent

      observer.call(this,ref) // observer change to innerHTML

    Object.getOwnPropertyNames(this.__proto__)
          .filter(name => ! (
            "constructor" === name ||
            "setup"       === name ||
            "render"      === name
          ))
          .forEach( name => {
          	if(/^[A-Z]/.test(name)){
              let result;
            	const wrapFragment = (data)=>{

              	if(undefined !== result && result.once)
                return result

                result = this[name](data)
                return result
              }
            	hyperHTML.define(name,wrapFragment)
            }else{
             that[name] = this[name].bind(that)
            }
             delete this[name]
           })
           function toString(){ return "hyper-element: "+this.localName }
           Object.defineProperty(that,"toString",{ value: toString.bind(this), writable: false })
                                                       // use shadow DOM, else fallback to render to element
     ref.shadow =  this//.attachShadow ? this.attachShadow({mode: 'closed'}) : this

     // Restrict access to hyperHTML
     const hyperHTMLbind = hyperHTML.bind(ref.shadow);
     ref.Html = function Html(...args){return hyperHTMLbind(...args)}
     ref.Html.wire = function wire(...args){return hyperHTML.wire(...args)}
     ref.Html.lite = function lite(...args){return hyperHTML(...args)}

     if(this.attrs){
       throw new Error("'attrs' is defined!!")
     }
     that.attrs = this.attachAttrs(this.attributes) || {};
     that.dataset = this.getDataset()
			const render = this.render
     this.render = (...data)=>{
        ref.observe = false
         setTimeout(()=>{ref.observe = true},0)

         render.call(that,ref.Html,...data)

         //after render check if dataset has chacked
         Object.getOwnPropertyNames(that.dataset)
              .filter(key => !this.dataset[key])
              .forEach( key => {

                  const value = that.dataset[key]
                  this.addDataset(that.dataset, key.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`))
                  that.dataset[key] = value
              })
     }

     if(this.setup){
       ref.teardown = this.setup.call(that,onNext.bind(this,that))
     }

     this.render()

    }
/*
    connectedCallback() {
   // 	console.log("Called when the element is inserted into a document, including into a shadow tree")
      // Called when the element is inserted into a document, including into a shadow tree
    }
    */
//+++++++++++++++++++++++++++++++++++++++ attach Attrs
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    addDataset(dataset, dash_key){

        const camel_key = dash_key.replace(/-([a-z])/g, g => g[1].toUpperCase())

        Object.defineProperty(dataset, camel_key, {
          enumerable:true, // can be selected
          configurable: true, // can be delete
          get: ()=> parceAttribute(camel_key,this.dataset[camel_key]),
          set: (value)=> {
              manager[this.identifier].attrsToIgnore["data-"+dash_key] = true
              if("string" === typeof value){
                  this.dataset[camel_key] = value
              } else {
                  this.dataset[camel_key] = JSON.stringify(value)
              }// END else
          } // END set

        }) // END defineProperty
    } // END addDataset

    getDataset(){
      const dataset = {}
      Object.keys(this.dataset)
            .forEach(key => this.addDataset(dataset, key.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`) ))// END forEach
        return dataset
    } // END getDataset

    attachAttrs(attributes){

     	const accumulator = { };

      for (let i = 0; i < attributes.length; i++) {
         const { value, name } = attributes[i];

         if("template" === name && !value){

         		const ref = manager[this.identifier]
            const re = /\s*(\{[\w]+\})\s*/g
        const templateVals = ref.innerHTML.split(re).reduce((vals,item)=>{

            if("{" === item[0] && "}" === item.slice(-1)){
                vals.keys.push(item.slice(1,-1))
            } else {
                vals.markup.push(item)
            }

            return vals
         },{markup:[],keys:[]})

            templateVals.id = ":"+templateVals.markup.join().trim()

            function fragment(data,render){

              const output = [templateVals.markup,...templateVals.keys.map( key => data[key] )]
              output.raw =  { value:templateVals.markup}
              return output
            }

            ref.Html.template = function template(data){
              return hyperHTML.wire(data,templateVals.id)(...fragment(data))
            }
            accumulator[name] = true;

         } else  {
         	   if((+value)+"" === (value+"").trim()){
           			accumulator[name] = +value
            } else{
           			accumulator[name] = value//parceAttribute(name,value)
            }
         }
     }
     return accumulator;
    }
/*
    attachedCallback(){
    	console.log("an instance was inserted into the document")
        //an instance was inserted into the document
    }
*/

//+++++++++++++++++++++++++++++++++++ element teardown
//++++++++++++++++++++++++++++++++++++++++++++++++++++
/*
    detachedCallback(){
      this.disposer && this.disposer()
      this.disconnectedCallback()
    }
*/
    attributeChangedCallback(name,oldVal,newVal){
      const ref = manager[this.identifier]
      const { attrsToIgnore } = ref;
      const that = ref.this
      if(0 <= name.indexOf("data-")){
        // we have data
        const dataSetName = name.slice("data-".length)
        if(null === oldVal){
        //if(undefined === that.dataset[dataSetName]){
             this.addDataset(that.dataset, dataSetName)
        } else if(null === newVal){
          //  Object.defineProperty(that.dataset, dataSetName, {  }) // END defineProperty
          const camel_key = dataSetName.replace(/-([a-z])/g, g => g[1].toUpperCase())
          delete that.dataset[camel_key]
        }
      }
      //newVal = parceAttribute(name,newVal)

    if( newVal === that.attrs[name]) {
      return
    }
      if(null === newVal){
        delete that.attrs[name]
      }
      else{
        that.attrs[name] = newVal
      }
      if(!!attrsToIgnore[name]){
        delete attrsToIgnore[name]
        return
      } else{
        this.render();
      } // END else

    } // END attributeChangedCallback

    disconnectedCallback(){
      ref.teardown && ref.teardown()
      //ref.teardown = null
      //Called when the element is removed from a document
    } // END disconnectedCallback
  }

//=====================================================
//================================================ Done
//=====================================================

  return hyperElement;

}));
