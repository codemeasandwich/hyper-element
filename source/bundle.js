'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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

  function onNext(store) {
    var _this = this;

    var storeFn = "function" == typeof store ? store : function () {
      return store;
    };

    var render = this.render;

    this.render = function () {
      _this.store = storeFn();
      render(_this.store);
    };

    return this.render;
  }

  var hyperElement = function (_HTMLElement) {
    _inherits(hyperElement, _HTMLElement);

    function hyperElement() {
      _classCallCheck(this, hyperElement);

      return _possibleConstructorReturn(this, (hyperElement.__proto__ || Object.getPrototypeOf(hyperElement)).apply(this, arguments));
    }

    _createClass(hyperElement, [{
      key: 'createdCallback',
      value: function createdCallback() {
        var _this3 = this;

        // an instance of the element is created
        this.identifier = Symbol(this.localName);
        var ref = manager[this.identifier] = {};

        Object.getOwnPropertyNames(this.__proto__).filter(function (name) {
          return !("constructor" === name || "setup" === name || "render" === name);
        }).forEach(function (name) {
          return _this3[name] = _this3[name].bind(_this3);
        });
        // use shadow DOM, else fallback to render to element
        ref.shadow = this.attachShadow ? this.attachShadow({ mode: 'closed' }) : this;

        var Html = ref.Html = hyperHTML.bind(ref.shadow);

        Html.wire = hyperHTML.wire;
        Html.lite = hyperHTML;
        if (this.props) {
          throw new Error("'props' is defined!!");
        }
        this.props = this.attachProps(this.attributes) || {};

        this.render = this.render.bind(this, Html);

        if (this.setup) ref.teardown = this.setup(onNext.bind(this));

        this.render();
      }
    }, {
      key: 'connectedCallback',
      value: function connectedCallback() {
        // Called when the element is inserted into a document, including into a shadow tree
      }
    }, {
      key: 'attachProps',
      value: function attachProps(attributes) {
        var accumulator = {};
        for (var i = 0; i < attributes.length; i++) {
          var value = attributes[i].value;
          var name = attributes[i].name;

          accumulator[name] = value;
        }
        return accumulator;
      }
    }, {
      key: 'attachedCallback',
      value: function attachedCallback() {
        //an instance was inserted into the document
      }
    }, {
      key: 'detachedCallback',
      value: function detachedCallback() {
        this.disposer && this.disposer();
        this.disconnectedCallback();
      }
    }, {
      key: 'attributeChangedCallback',
      value: function attributeChangedCallback(name, oldVal, newVal) {
        this.props[name] = newVal;
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
      get: function get() {
        return manager[this.identifier].shadow.innerHTML;
      }
    }]);

    return hyperElement;
  }(HTMLElement);

  return hyperElement;
});
