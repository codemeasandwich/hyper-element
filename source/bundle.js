'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _templateObject = _taggedTemplateLiteral([''], ['']);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

(function (factory) {

  if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
    // Node, CommonJS-like
    module.exports = factory(require('hyperhtml/cjs'));
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(['hyperhtml'], factory);
  } else {
    window.hyperElement = factory(window.hyperHTML);
  }
})(function (hyperHTML) {

  var manager = {},
      sharedAttrs = {},
      customTagMatch = /<\s*[a-z]+-[a-z][^>]*>/g,
      isCustomTag = /<+\w+[-]+\w/;

  function makeid() {
    var text = "";
    var possible = "bcdfghjklmnpqrstvwxyz";

    for (var i = 0; i < 15; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }return text;
  }

  //=====================================================
  //=========================== re-render on store change
  //=====================================================

  function onNext(that, store) {

    var storeFn = "function" == typeof store ? store : function () {
      return store;
    };

    var render = this.render;

    var render2 = function render2() {
      for (var _len = arguments.length, data = Array(_len), _key = 0; _key < _len; _key++) {
        data[_key] = arguments[_key];
      }

      if (undefined === store) {
        that.store = undefined;
        render.apply(undefined, data);
      } else {
        that.store = storeFn();
        render.apply(undefined, [that.store].concat(data));
      }
    };
    this.render = render2;

    return render2;
  }

  //=====================================================
  //======================== Observer change to innerHTML
  //=====================================================

  function observer(ref) {
    var _this = this;

    var that = ref.this;
    var mutationObserver = new MutationObserver(function (mutations) {
      /*
      //if(!this.textContent){
      const mutation = mutations[mutations.length - 1]
      const addedNodes = mutation.addedNodes[0]
      console.log(this,addedNodes,ref.observe)
      //}
      */
      var textContent = _this.textContent;
      /*
      				//if("" === textContent){
              //  const mutation = mutations[mutations.length - 1]
               // const addedNodes = mutation.addedNodes[0]
                if(addedNodes)
                textContent = addedNodes.data
             // }
      
      console.log(textContent === this.wrapedConten,"TEXT_CONTENT:",textContent, "WRAPED_CONTENT:",this.wrappedContent)
            */

      if (!ref.observe) return;

      ref.innerHTML = _this.innerHTML;
      // that.wrappedContent = textContent
      if (that.attrs.template) {
        //this.attachAttrs(this.attributes)
        that.attrs = _this.attachAttrs(_this.attributes) || {};
      }

      //reset the element
      hyperHTML.bind(ref.shadow)(_templateObject); // HACK, dont know why this works?

      that.wrappedContent = textContent;
      _this.render();
    });

    mutationObserver.observe(this, {
      // Set to true if mutations to target's attributes are to be observed.
      //attributes: true,

      // Set to true if mutations to target's data are to be observed.
      // characterData: true, // re-render on content change

      // Set to true if additions and removals of the target node's child elements (including text nodes) are to be observed.
      childList: true,

      // Set to true if mutations to target and target's descendants are to be observed.
      subtree: true

      // Set to true if attributes is set to true and target's attribute value before the mutation needs to be recorded.
      //attributeOldValue: true,

      // Set to true if characterData is set to true and target's data before the mutation needs to be recorded.
      //characterDataOldValue: true
    });
  }

  function buildTemplate(innerHTML) {

    var re = /(\{[\w]+\})/g; // /\s*(\{[\w]+\})\s*/g
    var templateVals = innerHTML.split(re).reduce(function (vals, item) {

      if ("{" === item[0] && "}" === item.slice(-1)) {
        vals.keys.push(item.slice(1, -1));
      } else {
        vals.markup.push(item);
      }

      return vals;
    }, { markup: [], keys: [] });

    templateVals.id = ":" + templateVals.markup.join().trim();

    function fragment(data, render) {

      var output = [templateVals.markup].concat(_toConsumableArray(templateVals.keys.map(function (key) {
        return data[key];
      })));
      output.raw = { value: templateVals.markup };
      return output;
    }

    return function template(data) {
      if ("object" !== (typeof data === 'undefined' ? 'undefined' : _typeof(data))) {
        throw new Error("Templates must be passed an object to be populated with. You passed " + JSON.stringify(data) + " to " + templateVals.id);
      }
      return hyperHTML.wire(data, templateVals.id).apply(undefined, _toConsumableArray(fragment(data)));
    };
  } // END buildTemplate

  function parceAttribute(key, value) {
    if ("template" === key && "" === value) {
      return true;
    }

    if (+value + "" === value.trim()) {
      return +value; // to number
    }

    var lowerCaseValue = value.toLowerCase().trim();

    if ("true" === lowerCaseValue) {
      return true;
    } else if ("false" === lowerCaseValue) {
      return false;
    } // END boolean check

    //if("data-json"===key){
    if (lowerCaseValue[0] === "[" && lowerCaseValue.slice(-1) === "]" || lowerCaseValue[0] === "{" && lowerCaseValue.slice(-1) === "}") {
      return JSON.parse(value);
    }

    return value;
  } // END parceAttribute


  //=====================================================
  //======================================= All the magic
  //=====================================================

  function _createdCallback() {
    var _this2 = this;

    // an instance of the element is created
    this.identifier = Symbol(this.localName);
    var ref = manager[this.identifier] = { attrsToIgnore: {} };
    ref.innerHTML = this.innerHTML;
    var that = ref.this = { element: this };
    that.wrappedContent = this.textContent;

    observer.call(this, ref); // observer change to innerHTML

    Object.getOwnPropertyNames(this.__proto__).filter(function (name) {
      return !("constructor" === name || "setup" === name || "render" === name);
    }).forEach(function (name) {
      if (/^[A-Z]/.test(name)) {
        var result = void 0;
        var templatestrings = {};
        var wrapFragment = function wrapFragment(data) {

          if (undefined !== result && result.once) return result;

          result = _this2[name](data);
          if (!!result.template) {
            if ("string" === typeof result.template) {
              /* if(undefined === result.values){
                 throw new Error("'values' was not defined for a 'template' in "+name)
               }*/
              if (!templatestrings[result.template]) {
                templatestrings[result.template] = buildTemplate(result.template);
              }
              result = { any: templatestrings[result.template](result.values || data) };
            } // END "string" === typeof result.template
            else if ("object" === _typeof(result.template) && "function" === typeof result.template.then) {

                result = Object.assign({}, result, { any: result.template.then(function (args) {
                    var template = args.template,
                        values = args.values;

                    if (!template && "string" === typeof args) {
                      template = args;
                      values = {};
                    }

                    if (!templatestrings[template]) {
                      templatestrings[template] = buildTemplate(template);
                    }
                    if (Array.isArray(values)) {
                      result = { any: values.map(templatestrings[template]), once: result.once };
                    } else {
                      result = { any: templatestrings[template](values || data), once: result.once };
                    }
                    return result.any;
                  })
                }); // END Object.assign
              } // END result.template is promise ?
              else {
                  throw new Error("unknow template type:" + _typeof(result.template) + " | " + JSON.stringify(result.template));
                }
          } // END !!result.template
          return result;
        }; // END wrapFragment
        hyperHTML.define(name, wrapFragment);
      } else {
        that[name] = _this2[name].bind(that);
      }
      delete _this2[name];
    });
    function toString() {
      return "hyper-element: " + this.localName;
    }
    Object.defineProperty(that, "toString", { value: toString.bind(this), writable: false });
    // use shadow DOM, else fallback to render to element
    ref.shadow = this; //.attachShadow ? this.attachShadow({mode: 'closed'}) : this

    // Restrict access to hyperHTML
    var hyperHTMLbind = hyperHTML.bind(ref.shadow);
    ref.Html = function Html() {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      if (args.some(function (item) {
        return "function" === typeof item;
      }) && args[0].some(function (t) {
        return isCustomTag.test(t);
      })) {

        var inCustomTag = false;
        var localName = "";
        var lookup = [];

        args[0].forEach(function (item, index, items) {

          if (isCustomTag.test(item)) {
            inCustomTag = -1 === item.substring(item.match(isCustomTag).index).indexOf(">");
            localName = inCustomTag && item.substring(item.indexOf(item.match(isCustomTag))).split(" ")[0].substr(1);
          } // END if CustomTag start
          else if (0 <= item.indexOf(">")) {
              inCustomTag = false;
              localName = "";
            } // END if CustomTag end

          if (!inCustomTag) {
            return;
          }
          var val = args[index + 1];

          if ("function" === typeof val || "object" === (typeof val === 'undefined' ? 'undefined' : _typeof(val))) {
            var attrName = item.split(" ").pop().slice(0, -1);
            if ("on" === attrName.substring(0, 2)) {
              throw new Error('\'on\' is reserve for native elements. Change: "' + attrName + '" for "' + localName + '" to something else');
            }
            var id = makeid();
            sharedAttrs[id] = { attrName: attrName, val: val, localName: localName };
            args[index + 1] = ("function" === typeof val ? 'fn-' : 'ob-') + id;
          } // END if("function" === typeof val)
        }); // END forEach
      } // END if

      return hyperHTMLbind.apply(undefined, args);
    }; // END ref.Html
    ref.Html.wire = function wire() {
      return hyperHTML.wire.apply(hyperHTML, arguments);
    };
    ref.Html.lite = function lite() {
      return hyperHTML.apply(undefined, arguments);
    };

    if (this.attrs) {
      throw new Error("'attrs' is defined!!");
    }
    that.attrs = this.attachAttrs(this.attributes) || {};
    that.dataset = this.getDataset();
    var render = this.render;
    this.render = function () {
      for (var _len3 = arguments.length, data = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        data[_key3] = arguments[_key3];
      }

      ref.observe = false;
      setTimeout(function () {
        ref.observe = true;
      }, 0);

      render.call.apply(render, [that, ref.Html].concat(data));

      //after render check if dataset has chacked
      Object.getOwnPropertyNames(that.dataset).filter(function (key) {
        return !_this2.dataset[key];
      }).forEach(function (key) {

        var value = that.dataset[key];
        _this2.addDataset(that.dataset, key.replace(/([A-Z])/g, function (g) {
          return '-' + g[0].toLowerCase();
        }));
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

  var hyperElement = function (_HTMLElement) {
    _inherits(hyperElement, _HTMLElement);

    function hyperElement() {
      _classCallCheck(this, hyperElement);

      return _possibleConstructorReturn(this, (hyperElement.__proto__ || Object.getPrototypeOf(hyperElement)).apply(this, arguments));
    }

    _createClass(hyperElement, [{
      key: 'createdCallback',


      //++++++++++++++++++++++++++++++++++++++++++++++ Setup
      //++++++++++++++++++++++++++++++++++++++++++++++++++++
      value: function createdCallback() {
        _createdCallback.call(this);
      }

      // Called when the element is inserted into a document, including into a shadow tree

    }, {
      key: 'connectedCallback',
      value: function connectedCallback() {
        _createdCallback.call(this);
      }

      //+++++++++++++++++++++++++++++++++++++++ attach Attrs
      //++++++++++++++++++++++++++++++++++++++++++++++++++++

    }, {
      key: 'addDataset',
      value: function addDataset(dataset, dash_key) {
        var _this4 = this;

        var camel_key = dash_key.replace(/-([a-z])/g, function (g) {
          return g[1].toUpperCase();
        });

        Object.defineProperty(dataset, camel_key, {
          enumerable: true, // can be selected
          configurable: true, // can be delete
          get: function get() {
            return parceAttribute(camel_key, _this4.dataset[camel_key]);
          },
          set: function set(value) {
            manager[_this4.identifier].attrsToIgnore["data-" + dash_key] = true;
            if ("string" === typeof value) {
              _this4.dataset[camel_key] = value;
            } else {
              _this4.dataset[camel_key] = JSON.stringify(value);
            } // END else
          } // END set

        }); // END defineProperty
      } // END addDataset

    }, {
      key: 'getDataset',
      value: function getDataset() {
        var _this5 = this;

        var dataset = {};
        Object.keys(this.dataset).forEach(function (key) {
          return _this5.addDataset(dataset, key.replace(/([A-Z])/g, function (g) {
            return '-' + g[0].toLowerCase();
          }));
        }); // END forEach
        return dataset;
      } // END getDataset

    }, {
      key: 'attachAttrs',
      value: function attachAttrs(attributes) {

        var accumulator = {};

        for (var i = 0; i < attributes.length; i++) {
          var _attributes$i = attributes[i],
              value = _attributes$i.value,
              name = _attributes$i.name;


          if ("template" === name && !value) {

            var ref = manager[this.identifier];
            ref.Html.template = buildTemplate(ref.innerHTML);
            accumulator[name] = true;
          } else if ("fn-" === value.substr(0, 3) || "ob-" === value.substr(0, 3) && !!sharedAttrs[value.substr(3)] && sharedAttrs[value.substr(3)].localName === this.localName) {
            accumulator[name] = sharedAttrs[value.substr(3)].val;
          } else {
            if (+value + "" === (value + "").trim()) {
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

    }, {
      key: 'attributeChangedCallback',
      value: function attributeChangedCallback(name, oldVal, newVal) {
        if (+newVal + "" === newVal.trim()) {
          newVal = +newVal; // to number
        }
        var ref = manager[this.identifier];
        var attrsToIgnore = ref.attrsToIgnore;

        var that = ref.this;
        if (0 <= name.indexOf("data-")) {
          // we have data
          var dataSetName = name.slice("data-".length);
          if (null === oldVal) {
            //if(undefined === that.dataset[dataSetName]){
            this.addDataset(that.dataset, dataSetName);
          } else if (null === newVal) {
            //  Object.defineProperty(that.dataset, dataSetName, {  }) // END defineProperty
            var camel_key = dataSetName.replace(/-([a-z])/g, function (g) {
              return g[1].toUpperCase();
            });
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
        if (!!attrsToIgnore[name]) {
          delete attrsToIgnore[name];
          return;
        } else {
          this.render();
        } // END else
      } // END attributeChangedCallback

    }, {
      key: 'disconnectedCallback',
      value: function disconnectedCallback() {
        var ref = manager[this.identifier];
        ref.teardown && ref.teardown();
        //ref.teardown = null
        //Called when the element is removed from a document
      } // END disconnectedCallback

    }, {
      key: 'innerShadow',


      //++++++++++++++++++++++++++++++++ get element content
      //++++++++++++++++++++++++++++++++++++++++++++++++++++

      get: function get() {
        return manager[this.identifier].shadow.innerHTML;
      }
    }]);

    return hyperElement;
  }(HTMLElement);

  //=====================================================
  //================================================ Done
  //=====================================================

  return hyperElement;
});
