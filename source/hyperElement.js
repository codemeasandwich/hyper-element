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

  function onNext(store){

      const storeFn = ("function" == typeof store) ? store : () => store

      const render = this.render

      this.render = ()=>{
        this.store = storeFn();
        render(this.store)
      }

      return this.render;
  }

//=====================================================
//======================== Observer change to innerHTML
//=====================================================

  function observer(ref){
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

console.log(textContent === this.wrapedConten,"TEXT_CONTENT:",textContent, "WRAPED_CONTENT:",this.wrapedContent)
      */

      if(!ref.observe) return;

      ref.innerHTML = this.innerHTML
        this.wrapedContent = textContent
			if(this.props.template){
      this.attachProps(this.attributes)
      }

        //reset the element
        hyperHTML.bind(ref.shadow)`` // HACK, dont know why this works?

        this.wrapedContent = textContent
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
    	const ref = manager[this.identifier] = {}
      this.wrapedContent = this.textContent
      ref.innerHTML = this.innerHTML

      observer.call(this,ref) // observer change to innerHTML

    Object.getOwnPropertyNames(this.__proto__)
          .filter(name => ! (
            "constructor" === name ||
            "setup"       === name ||
            "render"      === name
          ))
          .forEach( name => this[name] = this[name].bind(this) )
                                                       // use shadow DOM, else fallback to render to element
     ref.shadow =  this//.attachShadow ? this.attachShadow({mode: 'closed'}) : this

     ref.Html = hyperHTML.bind(ref.shadow);

     ref.Html.wire = hyperHTML.wire
     ref.Html.lite = hyperHTML
     if(this.props){
       throw new Error("'props' is defined!!")
     }
     this.props = this.attachProps(this.attributes) || {};
			const render = this.render
     this.render = (data)=>{
        ref.observe = false
         setTimeout(()=>{ref.observe = true},0)

         render.call(this,ref.Html,data)
     }

     if(this.setup)
     ref.teardown = this.setup(onNext.bind(this))

     this.render()

    }
/*
    connectedCallback() {
   // 	console.log("Called when the element is inserted into a document, including into a shadow tree")
      // Called when the element is inserted into a document, including into a shadow tree
    }
    */
//+++++++++++++++++++++++++++++++++++++++ attach Props
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    attachProps(attributes){
      const accumulator = {};
      for (let i = 0; i < attributes.length; i++) {
         const { value, name } = attributes[i];

         if("template" === name && "" === value){

         		const ref = manager[this.identifier]
            const re = /\s*(\{[\w]+\})\s*/g
        const templateVals = ref.innerHTML.split(re).reduce((vals,item)=>{

            if("{"===item[0] && "}" === item.slice(-1)){
                vals.keys.push(item.slice(1,-1))
            } else {
                vals.markup.push(item)
            }

            return vals
         },{markup:[],keys:[]})


            function fragment(data,render){

              const output = [templateVals.markup,...templateVals.keys.map( key => data[key] )]
              output.raw =  { value:templateVals.markup}
              return output
            }

            ref.Html.template = function template(data){
              return ref.Html.wire()(...fragment(data))
            }
            accumulator[name] = true;

         } else if("data-json"===name){
            accumulator[name] = JSON.parse(value)
         } else  {
            accumulator[name] = value;
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

    	if( newVal === this.props[name]) {
      	return
      } else if("template" === name){
      	this.props[name] = true
      	return
      }

      this.props[name] = ("data-json"===name)?JSON.parse(newVal):newVal

      this.render();
    }

    disconnectedCallback(){
      ref.teardown && ref.teardown()
      //ref.teardown = null
      //Called when the element is removed from a document
    }
  }

//=====================================================
//================================================ Done
//=====================================================

  return hyperElement;

}));
