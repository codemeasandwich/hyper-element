/**
 * hyper-element - hyperHTML + WebComponents
 * A lightweight library for creating custom elements with hyperHTML templating.
 */

/**
 * Tagged template literal function for rendering HTML content.
 * Use as a tagged template: Html`<div>${value}</div>`
 *
 * Supports auto-wire syntax for efficient list rendering:
 * ```javascript
 * Html`<ul>{+each ${users}}<li>{name}</li>{-each}</ul>`;
 * ```
 *
 * This is equivalent to:
 * ```javascript
 * Html`<ul>${users.map(u => Html.wire(u, id)`<li>${u.name}</li>`)}</ul>`;
 * ```
 *
 * Syntax:
 * - `{+each ${array}}...{-each}` - Loop with auto-wire for DOM reuse
 * - `{name}` - Access item property
 * - `{address.city}` - Nested property access
 * - `{...}` or `{ ... }` - Current item value (formatted: primitives escaped, arrays join(","), objects JSON, functions called)
 * - `{@}` - Current array index (0-based)
 * - `{+each {items}}...{-each}` - Nested loop using parent's property
 */
export interface HtmlFunction {
  /**
   * Render HTML content using tagged template literals
   */
  (strings: TemplateStringsArray, ...values: any[]): any;

  /**
   * Create a wired template bound to an object for efficient re-rendering
   * @param obj - Object to bind the template to
   * @param id - Optional template identifier
   */
  wire(
    obj: object,
    id?: string
  ): (strings: TemplateStringsArray, ...values: any[]) => any;

  /**
   * Create a lightweight template without wire binding
   */
  lite(strings: TemplateStringsArray, ...values: any[]): any;

  /**
   * Mark a string as safe HTML that should not be escaped.
   * Use with caution - only for trusted HTML content.
   * @param html - The HTML string to mark as safe
   */
  raw(html: string): { value: string };

  /**
   * Template function available when template attribute is used on the element
   */
  template?: (data: Record<string, any>) => any;
}

/**
 * Context object available as `this` in render() and setup() methods
 */
export interface ElementContext {
  /** The DOM element */
  element: HTMLElement;
  /** Parsed attributes from the element with automatic type coercion */
  attrs: Record<string, any>;
  /** Dataset proxy with automatic type coercion */
  dataset: Record<string, any>;
  /** Store value from setup */
  store?: any;
  /** Text content of element */
  wrappedContent: string;
}

/**
 * Result object returned from fragment methods (methods starting with capital letter)
 */
export interface FragmentResult {
  /** Rendered content */
  any?: any;
  /** Render only once */
  once?: boolean;
  /** Template string or promise resolving to template */
  template?:
    | string
    | Promise<
        string | { template: string; values: Record<string, any> | any[] }
      >;
  /** Template values */
  values?: Record<string, any> | any[];
  /** Text content */
  text?: string;
  /** HTML content */
  html?: string;
  /** Placeholder content */
  placeholder?: any;
}

/**
 * Callback for store updates in setup.
 * Call this with a store value or getter function to enable reactive updates.
 */
export type OnNextCallback = (
  store: any | (() => any)
) => (...data: any[]) => void;

/**
 * Base class for creating custom elements with hyperHTML templating.
 * Extend this class and implement the render() method to create a custom element.
 *
 * @example
 * ```javascript
 * class MyElement extends hyperElement {
 *   render(Html) {
 *     Html`<div>Hello ${this.attrs.name}!</div>`;
 *   }
 * }
 * customElements.define('my-element', MyElement);
 * ```
 */
export class hyperElement extends HTMLElement {
  /** Unique identifier for this element instance */
  identifier: symbol;

  /** Parsed attributes from the element with automatic type coercion */
  attrs: Record<string, any>;

  /** Store value from setup */
  store?: any;

  /** Dataset proxy with automatic type coercion */
  dataset: Record<string, any>;

  /** Text content of element */
  wrappedContent: string;

  /** Reference to the DOM element */
  element: HTMLElement;

  /** Get the innerHTML of the shadow/element content */
  get innerShadow(): string;

  /**
   * Optional setup lifecycle method. Called once when the element is connected.
   * Use this to set up stores, subscriptions, or other initialization logic.
   *
   * @param onNext - Call this with a store value or getter to enable reactive updates
   * @returns Optional teardown function called when element is disconnected
   *
   * @example
   * ```javascript
   * setup(onNext) {
   *   const store = createStore({ count: 0 });
   *   onNext(store.getState);
   *   return store.subscribe(() => this.render());
   * }
   * ```
   */
  setup?(onNext: OnNextCallback): void | (() => void);

  /**
   * Required render lifecycle method. Called on every render cycle.
   * Use the Html template tag to render content to the element.
   *
   * @param Html - Tagged template literal function for rendering
   * @param data - Additional data passed from store updates
   *
   * @example
   * ```javascript
   * render(Html) {
   *   Html`<div>Hello ${this.attrs.name}!</div>`;
   * }
   * ```
   */
  render(Html: HtmlFunction, ...data: any[]): void;
}

declare global {
  interface Window {
    hyperElement: typeof hyperElement;
    hyperHTML: any;
  }
}

export default hyperElement;
