// Dynamically load hyper-element based on query parameter
// Usage: Add ?build=minified to test against build/hyperElement.min.js
(function() {
  const params = new URLSearchParams(window.location.search);
  const build = params.get('build');

  const src = build === 'minified'
    ? '../build/hyperElement.min.js'
    : '../source/hyperElement.js';

  // Use document.write for synchronous loading
  document.write('<script src="' + src + '"><\/script>');
})();
