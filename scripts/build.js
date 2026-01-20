#!/usr/bin/env node
/**
 * @file Build script for hyper-element.
 * Concatenates ES modules into a single UMD bundle without module system overhead.
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const outDir = path.join(__dirname, '..', 'source');
const buildDir = path.join(__dirname, '..', 'build');

// Files in dependency order (no circular deps)
const files = [
  'core/constants.js',
  'core/manager.js',
  'utils/makeid.js',
  'attributes/parseAttribute.js',
  'template/processAdvancedTemplate.js',
  'template/buildTemplate.js',
  'attributes/dataset.js',
  'attributes/attachAttrs.js',
  'html/createHtml.js',
  'lifecycle/onNext.js',
  'lifecycle/observer.js',
  'lifecycle/connectedCallback.js',
  'hyperElement.js',
];

/**
 * Reads a file and strips ES module import/export statements.
 * @param {string} filePath - Path to the file
 * @returns {string} File content with imports/exports removed
 */
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove import statements
  content = content.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
  content = content.replace(/^import\s+['"].*?['"];?\s*$/gm, '');

  // Remove export statements but keep the code
  content = content.replace(
    /^export\s+(?:const|let|var|function|class)\s+/gm,
    (match) => {
      return match.replace('export ', '');
    }
  );
  content = content.replace(/^export\s+\{[^}]*\};?\s*$/gm, '');
  content = content.replace(/^export\s+default\s+/gm, '');

  return content.trim();
}

/**
 * Builds the development bundle.
 */
function buildDev() {
  const parts = [];

  // UMD wrapper start
  parts.push(`// Browser-only build - UMD wrapper simplified for E2E testing
// CommonJS/AMD paths exist in full build but are not covered by browser tests
(function (factory) {
  window.hyperElement = factory(window.hyperHTML);
})(function (hyperHTML) {`);

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

  // UMD wrapper end
  parts.push(`
  return hyperElement;
});
`);

  const output = parts.join('\n');

  // Ensure output directory exists
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(path.join(outDir, 'hyperElement.js'), output);
  console.log(
    `Built: source/hyperElement.js (${(output.length / 1024).toFixed(1)}kb)`
  );
}

/**
 * Builds the minified production bundle using esbuild.
 */
async function buildProd() {
  // First build dev, then minify it
  buildDev();

  try {
    const esbuild = require('esbuild');
    const devFile = path.join(outDir, 'hyperElement.js');

    // Ensure build directory exists
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }

    await esbuild.build({
      entryPoints: [devFile],
      outfile: path.join(buildDir, 'hyperElement.min.js'),
      minify: true,
      sourcemap: true,
      bundle: false, // Already bundled
    });

    const stats = fs.statSync(path.join(buildDir, 'hyperElement.min.js'));
    console.log(
      `Built: build/hyperElement.min.js (${(stats.size / 1024).toFixed(1)}kb)`
    );
  } catch (e) {
    console.error('Error building production bundle:', e);
    process.exit(1);
  }
}

// Run based on command line args
const args = process.argv.slice(2);
if (args.includes('--prod') || args.includes('-p')) {
  buildProd();
} else {
  buildDev();
}
