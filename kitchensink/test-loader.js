/**
 * @file Test loader for hyper-element kitchensink tests.
 * Loads the unminified bundle by default for coverage, or minified via ?bundle=min.
 */

(function () {
  var params = new URLSearchParams(window.location.search);
  var bundle =
    params.get('bundle') === 'min'
      ? 'hyperElement.min.js'
      : 'hyperElement.bundle.js';
  document.write('<script src="../build/' + bundle + '"><\/script>');
})();
