#!/usr/bin/env node
/**
 * @file Build script for hyper-element.
 * Concatenates ES modules into a single UMD bundle without module system overhead.
 */

const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

const srcDir = path.join(__dirname, '..', 'src');
const buildDir = path.join(__dirname, '..', 'build');

// Files in dependency order (no circular deps)
const files = [
  // Core constants and manager
  'core/constants.js',
  'core/manager.js',
  'utils/makeid.js',
  'utils/escape.js',

  // Render core (uhtml-inspired)
  'render/constants.js',
  'render/creator.js',
  'render/resolve.js',
  'render/diff.js',
  'render/persistent-fragment.js',
  'render/keyed.js',
  'render/nodes.js',
  'render/parser.js',
  'render/update.js',
  'render/hole.js',
  'render/index.js',

  // Signals (reactivity)
  'signals/index.js',

  // Attributes and templates
  'attributes/parseAttribute.js',
  'template/processAdvancedTemplate.js',
  'template/buildTemplate.js',
  'attributes/dataset.js',
  'attributes/attachAttrs.js',

  // HTML processing
  'html/parseEachBlocks.js',
  'html/createHtml.js',

  // Lifecycle
  'lifecycle/onNext.js',
  'lifecycle/observer.js',
  'lifecycle/connectedCallback.js',

  // Main class
  'hyperElement.js',
];

/**
 * Reads a file and strips ES module import/export statements.
 * @param {string} filePath - Path to the file
 * @returns {string} File content with imports/exports removed
 */
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove multi-line import statements (import { ... } from '...')
  content = content.replace(/^import\s+\{[\s\S]*?\}\s+from\s+['"].*?['"];?\s*$/gm, '');

  // Remove single-line import statements
  content = content.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
  content = content.replace(/^import\s+['"].*?['"];?\s*$/gm, '');

  // Remove export statements but keep the code
  content = content.replace(
    /^export\s+(?:const|let|var|function|class)\s+/gm,
    (match) => {
      return match.replace('export ', '');
    }
  );
  // Remove multi-line export { ... } statements
  content = content.replace(/^export\s+\{[\s\S]*?\};?\s*$/gm, '');
  content = content.replace(/^export\s+default\s+/gm, '');

  // Remove JSDoc comments (they get counted as statements by v8-to-istanbul)
  content = content.replace(/\/\*\*[\s\S]*?\*\//g, '');

  // Remove single-line comments that are on their own line
  content = content.replace(/^\s*\/\/.*$/gm, '');

  // Clean up multiple blank lines
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

  return content.trim();
}

/**
 * Creates the bundled source content from src/ files.
 * @returns {string} The bundled UMD source
 */
function createBundle() {
  const parts = [];

  // IIFE wrapper start - self-contained, no external dependencies
  parts.push(`// hyper-element v${pkg.version} - zero runtime dependencies
(function () {`);

  // Add each file's content
  for (const file of files) {
    const filePath = path.join(srcDir, file);
    const content = processFile(filePath);
    parts.push(`\n  // ${file}`);
    // Indent content
    parts.push(
      content
        .split('\n')
        .map((line) => (line ? '  ' + line : ''))
        .join('\n')
    );
  }

  // IIFE wrapper end
  parts.push(`
  console.info('hyper-element v${pkg.version} by ${pkg.author}');
  window.hyperElement = hyperElement;
})();
`);

  return parts.join('\n');
}

/**
 * Builds the minified production bundle using esbuild.
 */
async function build() {
  try {
    const esbuild = require('esbuild');

    // Ensure build directory exists
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }

    // Create bundle content
    const bundleContent = createBundle();

    // Write the unminified bundle first (for source map accuracy)
    const unminifiedPath = path.join(buildDir, 'hyperElement.bundle.js');
    fs.writeFileSync(unminifiedPath, bundleContent);

    // Minify using the file (not stdin) for better source map support
    const result = await esbuild.build({
      entryPoints: [unminifiedPath],
      outfile: path.join(buildDir, 'hyperElement.min.js'),
      minify: true,
      sourcemap: true,
      bundle: false,
    });

    const stats = fs.statSync(path.join(buildDir, 'hyperElement.min.js'));
    console.log(
      `Built: build/hyperElement.min.js (${(stats.size / 1024).toFixed(1)}kb)`
    );
  } catch (e) {
    console.error('Error building bundle:', e);
    process.exit(1);
  }
}

// Run build
build();
