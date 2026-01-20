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

  const render = this.render;

  /**
   * Wrapped render function that injects store state.
   * @param {...any} data - Additional render data
   * @returns {void}
   */
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
