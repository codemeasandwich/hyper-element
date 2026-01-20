// Browser-only build - UMD wrapper simplified for E2E testing
// CommonJS/AMD paths exist in full build but are not covered by browser tests
(function (factory) {
  window.hyperElement = factory(window.hyperHTML);
})(function (hyperHTML) {
  const manager = {},
    sharedAttrs = {},
    isCustomTag = /<+\w+[-]+\w/;

  function makeid() {
    var text = '';
    var possible = 'bcdfghjklmnpqrstvwxyz';

    for (var i = 0; i < 15; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }

  //=====================================================
  //=========================== re-render on store change
  //=====================================================

  function onNext(that, store) {
    const storeFn = 'function' == typeof store ? store : () => store;

    const render = this.render;

    const render2 = (...data) => {
      if (undefined === store) {
        that.store = undefined;
        render(...data);
      } else {
        that.store = storeFn();
        render(that.store, ...data);
      }
    };
    this.render = render2;

    return render2;
  }

  //=====================================================
  //======================== Observer change to innerHTML
  //=====================================================

  function observer(ref) {
    const that = ref.this;
    const mutationObserver = new MutationObserver((mutations) => {
      if (!ref.observe) return;

      // Check for attribute changes
      const attrMutations = mutations.filter((m) => m.type === 'attributes');
      if (attrMutations.length > 0) {
        // Re-attach attrs to pick up new shared attr values
        that.attrs = this.attachAttrs(this.attributes) || {};
        this.render();
        return;
      }

      // Handle content changes
      let textContent = this.textContent;

      ref.innerHTML = this.innerHTML;
      if (that.attrs.template) {
        that.attrs = this.attachAttrs(this.attributes) || {};
      }

      //reset the element
      hyperHTML.bind(ref.shadow)``; // HACK, dont know why this works?

      that.wrappedContent = textContent;
      this.render();
    });

    mutationObserver.observe(this, {
      // Watch attribute changes to trigger re-renders
      attributes: true,

      // Set to true if additions and removals of the target node's child elements (including text nodes) are to be observed.
      childList: true,

      // Set to true if mutations to target and target's descendants are to be observed.
      subtree: true,
    });
  }

  // Process handlebars-like constructs in template
  function processAdvancedTemplate(template, data) {
    let result = template;

    // Process {#each array}...{/each}
    const eachRegex = /\{#each\s+(\w+)\}([\s\S]*?)\{\/each\}/g;
    result = result.replace(eachRegex, (match, arrayName, content) => {
      const arr = data[arrayName];
      if (!Array.isArray(arr)) return '';
      return arr
        .map((item, index) => {
          let itemContent = content;
          // Replace {.} with current item (for primitives)
          itemContent = itemContent.replace(/\{\.\}/g, item);
          // Replace {@index} with current index
          itemContent = itemContent.replace(/\{@index\}/g, index);
          // If item is object, replace {prop} with item.prop
          if (typeof item === 'object' && item !== null) {
            Object.keys(item).forEach((key) => {
              itemContent = itemContent.replace(
                new RegExp('\\{' + key + '\\}', 'g'),
                item[key]
              );
            });
          }
          return itemContent;
        })
        .join('');
    });

    // Process {#if condition}...{else}...{/if}
    const ifElseRegex = /\{#if\s+(\w+)\}([\s\S]*?)\{else\}([\s\S]*?)\{\/if\}/g;
    result = result.replace(
      ifElseRegex,
      (match, condition, ifContent, elseContent) => {
        return data[condition] ? ifContent : elseContent;
      }
    );

    // Process {#if condition}...{/if} (without else)
    const ifRegex = /\{#if\s+(\w+)\}([\s\S]*?)\{\/if\}/g;
    result = result.replace(ifRegex, (match, condition, content) => {
      return data[condition] ? content : '';
    });

    // Process {#unless condition}...{/unless}
    const unlessRegex = /\{#unless\s+(\w+)\}([\s\S]*?)\{\/unless\}/g;
    result = result.replace(unlessRegex, (match, condition, content) => {
      return data[condition] ? '' : content;
    });

    return result;
  }

  function buildTemplate(innerHTML) {
    // Check if template has advanced features
    const hasAdvanced = /\{#(if|each|unless)\s/.test(innerHTML);

    if (hasAdvanced) {
      // Use advanced template processing
      return function template(data) {
        if ('object' !== typeof data) {
          throw new Error(
            'Templates must be passed an object. You passed ' +
              JSON.stringify(data)
          );
        }
        // Process advanced template features
        let result = processAdvancedTemplate(innerHTML, data);
        // Simple variable substitution for remaining {var} patterns
        result = result.replace(/\{(\w+)\}/g, (match, key) => {
          return data[key] != null ? data[key] : '';
        });
        return result;
      };
    }

    // Original simple template processing
    const re = /(\{[\w]+\})/g;
    const templateVals = innerHTML.split(re).reduce(
      (vals, item) => {
        if ('{' === item[0] && '}' === item.slice(-1)) {
          vals.keys.push(item.slice(1, -1));
        } else {
          vals.markup.push(item);
        }

        return vals;
      },
      { markup: [], keys: [] }
    );

    templateVals.id = ':' + templateVals.markup.join().trim();

    function fragment(data, _render) {
      const output = [
        templateVals.markup,
        ...templateVals.keys.map((key) => data[key]),
      ];
      output.raw = { value: templateVals.markup };
      return output;
    }

    return function template(data) {
      if ('object' !== typeof data) {
        throw new Error(
          'Templates must be passed an object to be populated with. You passed ' +
            JSON.stringify(data) +
            ' to ' +
            templateVals.id
        );
      }
      return hyperHTML.wire(data, templateVals.id)(...fragment(data));
    };
  } // END buildTemplate

  function parceAttribute(key, value) {
    if ('template' === key && '' === value) {
      return true;
    }

    if (+value + '' === value.trim()) {
      return +value; // to number
    }

    const lowerCaseValue = value.toLowerCase().trim();

    if ('true' === lowerCaseValue) {
      return true;
    } else if ('false' === lowerCaseValue) {
      return false;
    } // END boolean check

    //if("data-json"===key){
    if (
      (lowerCaseValue[0] === '[' && lowerCaseValue.slice(-1) === ']') ||
      (lowerCaseValue[0] === '{' && lowerCaseValue.slice(-1) === '}')
    ) {
      return JSON.parse(value);
    }

    return value;
  } // END parceAttribute

  //=====================================================
  //======================================= All the magic
  //=====================================================

  function createdCallback() {
    // an instance of the element is created
    this.identifier = Symbol(this.localName);
    const ref = (manager[this.identifier] = { attrsToIgnore: {} });
    ref.innerHTML = this.innerHTML;
    const that = (ref.this = { element: this });
    that.wrappedContent = this.textContent;

    observer.call(this, ref); // observer change to innerHTML

    Object.getOwnPropertyNames(this.__proto__)
      .filter(
        (name) =>
          !('constructor' === name || 'setup' === name || 'render' === name)
      )
      .forEach((name) => {
        if (/^[A-Z]/.test(name)) {
          let result;
          const templatestrings = {};
          const wrapFragment = (data) => {
            if (undefined !== result && result.once) return result;

            result = this[name](data);
            if (result.template) {
              if ('string' === typeof result.template) {
                /* if(undefined === result.values){
                    throw new Error("'values' was not defined for a 'template' in "+name)
                  }*/
                if (!templatestrings[result.template]) {
                  templatestrings[result.template] = buildTemplate(
                    result.template
                  );
                }
                result = {
                  any: templatestrings[result.template](result.values || data),
                };
              } // END "string" === typeof result.template
              else if (
                'object' === typeof result.template &&
                'function' === typeof result.template.then
              ) {
                result = Object.assign({}, result, {
                  any: result.template.then((args) => {
                    let { template, values } = args;
                    if (!template && 'string' === typeof args) {
                      template = args;
                      values = {};
                    }

                    if (!templatestrings[template]) {
                      templatestrings[template] = buildTemplate(template);
                    }
                    if (Array.isArray(values)) {
                      result = {
                        any: values.map(templatestrings[template]),
                        once: result.once,
                      };
                    } else {
                      result = {
                        any: templatestrings[template](values || data),
                        once: result.once,
                      };
                    }
                    return result.any;
                  }),
                }); // END Object.assign
              } // END result.template is promise ?
              else {
                throw new Error(
                  'unknow template type:' +
                    typeof result.template +
                    ' | ' +
                    JSON.stringify(result.template)
                );
              }
            } // END !!result.template
            return result;
          }; // END wrapFragment
          hyperHTML.define(name, wrapFragment);
        } else {
          that[name] = this[name].bind(that);
        }
        delete this[name];
      });
    function toString() {
      return 'hyper-element: ' + this.localName;
    }
    Object.defineProperty(that, 'toString', {
      value: toString.bind(this),
      writable: false,
    });
    // use shadow DOM, else fallback to render to element
    ref.shadow = this; //.attachShadow ? this.attachShadow({mode: 'closed'}) : this

    // Restrict access to hyperHTML
    const hyperHTMLbind = hyperHTML.bind(ref.shadow);
    ref.Html = function Html(...args) {
      if (
        args
          .slice(1)
          .some(
            (item) =>
              'function' === typeof item ||
              (item !== null && 'object' === typeof item)
          ) &&
        args[0].some((t) => isCustomTag.test(t))
      ) {
        let inCustomTag = false;
        let localName = '';
        args[0].forEach((item, index, _items) => {
          if (isCustomTag.test(item)) {
            inCustomTag =
              -1 === item.substring(item.match(isCustomTag).index).indexOf('>');
            localName =
              inCustomTag &&
              item
                .substring(item.indexOf(item.match(isCustomTag)))
                .split(' ')[0]
                .substr(1);
          } // END if CustomTag start
          else if (0 <= item.indexOf('>')) {
            inCustomTag = false;
            localName = '';
          } // END if CustomTag end

          if (!inCustomTag) {
            return;
          }
          const val = args[index + 1];

          if (
            'function' === typeof val ||
            (val !== null && 'object' === typeof val)
          ) {
            const attrName = item.split(' ').pop().slice(0, -1);
            if ('on' === attrName.substring(0, 2)) {
              throw new Error(
                `'on' is reserve for native elements. Change: "${attrName}" for "${localName}" to something else`
              );
            }
            // Don't intercept style - let hyperHTML handle it natively
            if ('style' === attrName) {
              return;
            }
            const id = makeid();
            sharedAttrs[id] = { attrName, val, localName };
            args[index + 1] = ('function' === typeof val ? 'fn-' : 'ob-') + id;
          } // END if("function" === typeof val)
        }); // END forEach
      } // END if

      return hyperHTMLbind(...args);
    }; // END ref.Html
    ref.Html.wire = function wire(...args) {
      return hyperHTML.wire(...args);
    };
    ref.Html.lite = function lite(...args) {
      return hyperHTML(...args);
    };

    // Guard removed: this.attrs is set by the library, cannot be pre-defined by user
    that.attrs = this.attachAttrs(this.attributes);
    that.dataset = this.getDataset();
    const render = this.render;
    this.render = (...data) => {
      ref.observe = false;
      setTimeout(() => {
        ref.observe = true;
      }, 0);

      render.call(that, ref.Html, ...data);

      //after render check if dataset has chacked
      Object.getOwnPropertyNames(that.dataset)
        .filter((key) => !this.dataset[key])
        .forEach((key) => {
          const value = that.dataset[key];
          this.addDataset(
            that.dataset,
            key.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`)
          );
          that.dataset[key] = value;
        });
    };

    if (this.setup) {
      ref.teardown = this.setup.call(that, onNext.bind(this, that));
    }

    this.render();
  }

  //=====================================================
  //==================================== Wrap the element
  //=====================================================

  class hyperElement extends HTMLElement {
    //++++++++++++++++++++++++++++++++ get element content
    //++++++++++++++++++++++++++++++++++++++++++++++++++++

    get innerShadow() {
      return manager[this.identifier].shadow.innerHTML;
    }

    //++++++++++++++++++++++++++++++++++++++++++++++ Setup
    //++++++++++++++++++++++++++++++++++++++++++++++++++++
    // createdCallback is the deprecated v0 Custom Elements API
    // Modern browsers only call connectedCallback (v1 API)

    // Called when the element is inserted into a document, including into a shadow tree
    connectedCallback() {
      createdCallback.call(this);
    }

    //+++++++++++++++++++++++++++++++++++++++ attach Attrs
    //++++++++++++++++++++++++++++++++++++++++++++++++++++

    addDataset(dataset, dash_key) {
      const camel_key = dash_key.replace(/-([a-z])/g, (g) =>
        g[1].toUpperCase()
      );

      Object.defineProperty(dataset, camel_key, {
        enumerable: true, // can be selected
        configurable: true, // can be delete
        get: () => parceAttribute(camel_key, this.dataset[camel_key]),
        set: (value) => {
          manager[this.identifier].attrsToIgnore['data-' + dash_key] = true;
          if ('string' === typeof value) {
            this.dataset[camel_key] = value;
          } else {
            this.dataset[camel_key] = JSON.stringify(value);
          } // END else
        }, // END set
      }); // END defineProperty
    } // END addDataset

    getDataset() {
      const dataset = {};
      Object.keys(this.dataset).forEach((key) =>
        this.addDataset(
          dataset,
          key.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`)
        )
      ); // END forEach
      return dataset;
    } // END getDataset

    attachAttrs(attributes) {
      const accumulator = {};

      for (let i = 0; i < attributes.length; i++) {
        const { value, name } = attributes[i];

        if ('template' === name && !value) {
          const ref = manager[this.identifier];
          ref.Html.template = buildTemplate(ref.innerHTML);
          accumulator[name] = true;
        } else if (
          ('fn-' === value.substr(0, 3) || 'ob-' === value.substr(0, 3)) &&
          !!sharedAttrs[value.substr(3)] &&
          sharedAttrs[value.substr(3)].localName === this.localName
        ) {
          accumulator[name] = sharedAttrs[value.substr(3)].val;
        } else {
          if (+value + '' === (value + '').trim()) {
            accumulator[name] = +value;
          } else {
            accumulator[name] = value; //parceAttribute(name,value)
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
    attributeChangedCallback(name, oldVal, newVal) {
      // Guard: attributeChangedCallback can fire before connectedCallback
      // when observedAttributes is defined and attributes are set before DOM insertion
      const ref = manager[this.identifier];
      if (!ref) return;

      if (newVal !== null && +newVal + '' === newVal.trim()) {
        newVal = +newVal; // to number
      }
      const { attrsToIgnore } = ref;
      const that = ref.this;
      if (0 <= name.indexOf('data-')) {
        // we have data
        const dataSetName = name.slice('data-'.length);
        if (null === oldVal) {
          //if(undefined === that.dataset[dataSetName]){
          this.addDataset(that.dataset, dataSetName);
        } else if (null === newVal) {
          //  Object.defineProperty(that.dataset, dataSetName, {  }) // END defineProperty
          const camel_key = dataSetName.replace(/-([a-z])/g, (g) =>
            g[1].toUpperCase()
          );
          delete that.dataset[camel_key];
        }
      }
      //newVal = parceAttribute(name,newVal)

      if (newVal === that.attrs[name]) {
        return;
      }
      if (null === newVal) {
        delete that.attrs[name];
      } else {
        that.attrs[name] = newVal;
      }
      if (attrsToIgnore[name]) {
        delete attrsToIgnore[name];
        return;
      } else {
        this.render();
      } // END else
    } // END attributeChangedCallback

    disconnectedCallback() {
      const ref = manager[this.identifier];
      ref.teardown && ref.teardown();
      //ref.teardown = null
      //Called when the element is removed from a document
    } // END disconnectedCallback
  }

  //=====================================================
  //================================================ Done
  //=====================================================

  return hyperElement;
});
