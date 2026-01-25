/**
 * @file Reactive re-render factory for store-based updates.
 * Creates a render function that automatically passes store state.
 */

/**
 * Callback for store updates in setup.
 * @callback OnNextCallback
 * @param {any|Function} store - Store value or getter function
 * @returns {Function} Render function with store
 */

/**
 * Creates a render function that injects store state on each render.
 * This is called from setup() to enable reactive updates when store changes.
 *
 * @this {HTMLElement} The custom element instance
 * @param {Object} that - The element context
 * @param {any|Function} store - Store value or getter function
 * @returns {Function} Render function that includes store state
 * @example
 * // In setup method:
 * setup(onNext) {
 *   const store = { count: 0 };
 *   const render = onNext(() => store);
 *   // render() will now pass store as first argument
 * }
 */
export function onNext(that, store) {
  const storeFn = 'function' == typeof store ? store : () => store;

  // Get the base render function (unwrapped if previously wrapped)
  const baseRender = this._baseRender || this.render;
  this._baseRender = baseRender;

  /**
   * Wrapped render function that injects store state.
   * @param {...any} data - Additional render data
   * @returns {void}
   */
  const render2 = (...data) => {
    if (undefined === store) {
      that.store = undefined;
      baseRender(...data);
    } else {
      that.store = storeFn();
      baseRender(that.store, ...data);
    }
  };
  this.render = render2;

  // Trigger re-render if called after initial setup
  if (this._onNextInitialized) {
    render2();
  } else {
    this._onNextInitialized = true;
  }

  return render2;
}
