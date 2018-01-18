'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _templateObject = _taggedTemplateLiteral([''], ['']);

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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

  var manager = {};

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

  function parceAttribute(key, value) {
    if ("template" === key && "" === value) {
      return true;
    }
    if ("data-json" === key) {
      return JSON.parse(value);
    }

    if (+value + "" === value) {
      return +value; // to number
    }

    var lowerCaseValue = value.toLowerCase();

    if ("true" === lowerCaseValue) {
      return true;
    } else if ("false" === lowerCaseValue) {
      return false;
    }

    return value;
  }

  //=====================================================
  //======================================= All the magic
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
        var _this3 = this;

        // an instance of the element is created
        this.identifier = Symbol(this.localName);
        var ref = manager[this.identifier] = {};
        ref.innerHTML = this.innerHTML;
        var that = ref.this = { element: this };
        that.wrappedContent = this.textContent;

        observer.call(this, ref); // observer change to innerHTML

        Object.getOwnPropertyNames(this.__proto__).filter(function (name) {
          return !("constructor" === name || "setup" === name || "render" === name);
        }).forEach(function (name) {
          if (/^[A-Z]/.test(name)) {
            var result = void 0;
            var wrapFragment = function wrapFragment(data) {

              if (undefined !== result && result.once) return result;

              result = _this3[name](data);
              return result;
            };
            hyperHTML.define(name, wrapFragment);
          } else {
            that[name] = _this3[name].bind(that);
          }
          delete _this3[name];
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
          return hyperHTMLbind.apply(undefined, arguments);
        };
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
        var render = this.render;
        this.render = function () {
          for (var _len2 = arguments.length, data = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            data[_key2] = arguments[_key2];
          }

          ref.observe = false;
          setTimeout(function () {
            ref.observe = true;
          }, 0);

          render.call.apply(render, [that, ref.Html].concat(data));
        };

        if (this.setup) ref.teardown = this.setup.call(that, onNext.bind(this, that));

        this.render();
      }
      /*
          connectedCallback() {
         // 	console.log("Called when the element is inserted into a document, including into a shadow tree")
            // Called when the element is inserted into a document, including into a shadow tree
          }
          */
      //+++++++++++++++++++++++++++++++++++++++ attach Attrs
      //++++++++++++++++++++++++++++++++++++++++++++++++++++

    }, {
      key: 'attachAttrs',
      value: function attachAttrs(attributes) {
        var _this4 = this;

        var accumulator = {};
        for (var i = 0; i < attributes.length; i++) {
          var _attributes$i = attributes[i],
              value = _attributes$i.value,
              name = _attributes$i.name;


          if ("template" === name && !value) {
            (function () {
              var fragment = function fragment(data, render) {

                var output = [templateVals.markup].concat(_toConsumableArray(templateVals.keys.map(function (key) {
                  return data[key];
                })));
                output.raw = { value: templateVals.markup };
                return output;
              };

              var ref = manager[_this4.identifier];
              var re = /\s*(\{[\w]+\})\s*/g;
              var templateVals = ref.innerHTML.split(re).reduce(function (vals, item) {

                if ("{" === item[0] && "}" === item.slice(-1)) {
                  vals.keys.push(item.slice(1, -1));
                } else {
                  vals.markup.push(item);
                }

                return vals;
              }, { markup: [], keys: [] });

              templateVals.id = ":" + templateVals.markup.join().trim();

              ref.Html.template = function template(data) {
                return hyperHTML.wire(data, templateVals.id).apply(undefined, _toConsumableArray(fragment(data)));
              };
              accumulator[name] = true;
            })();
          } else {
            accumulator[name] = parceAttribute(name, value);
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
        var that = manager[this.identifier].this;

        newVal = parceAttribute(name, newVal);

        if (newVal === that.attrs[name]) {
          return;
        }

        that.attrs[name] = newVal;

        this.render();
      }
    }, {
      key: 'disconnectedCallback',
      value: function disconnectedCallback() {
        ref.teardown && ref.teardown();
        //ref.teardown = null
        //Called when the element is removed from a document
      }
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
