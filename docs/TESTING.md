# Testing Guide

hyper-element uses [Playwright](https://playwright.dev/) for end-to-end testing with 100% code coverage enforcement.

## Running Tests

### Basic Test Run

```bash
npm test
```

This runs all tests and generates a coverage report.

### Interactive UI Mode

For debugging and development:

```bash
npm run test:ui
```

This opens the Playwright UI where you can:
- See tests running in real-time
- Step through tests
- View screenshots and traces
- Re-run individual tests

### Headed Browser Mode

To watch tests run in a visible browser:

```bash
npm run test:headed
```

## Test Structure

Tests are located in the `kitchensink/` directory:

```
kitchensink/
├── kitchensink.spec.js      # Main test runner
├── basic-rendering.html     # Basic element rendering
├── attributes.html          # Attribute parsing
├── dataset.html             # Data attribute handling
├── dataset-mutations.html   # Dynamic dataset updates
├── templates.html           # Template system
├── advanced-templates.html  # {#if}, {#each}, {#unless}
├── fragments-async.html     # Async fragments
├── fragments-templates.html # Template fragments
├── nested-elements.html     # Component composition
├── event-callbacks.html     # Event delegation
├── setup-async.html         # Async setup patterns
├── content-handling.html    # Inner content management
├── content-mutations.html   # Dynamic content updates
├── child-redraw.html        # Child element redrawing
├── child-styles.html        # Style inheritance
├── corner-cases.html        # Edge cases
├── complex-type-attrs.html  # Type coercion
└── coverage-edge-cases.html # Coverage edge cases
```

## How Tests Work

Each HTML file in `kitchensink/` is a self-contained test scenario that:

1. Includes the hyper-element library
2. Defines custom elements to test specific features
3. Contains assertions using `data-test-result` attributes

The `kitchensink.spec.js` file:
- Auto-discovers all HTML test files
- Runs each test against both source and minified builds
- Collects V8 coverage data
- Validates test assertions
- Reports console errors on failure

## Coverage Requirements

**100% code coverage is required** for all contributions:
- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%

Coverage is checked automatically by the pre-commit hook. If coverage drops below 100%, the commit will be blocked.

### Viewing Coverage Reports

After running tests, coverage reports are generated in:
- `coverage/coverage-final.json` - Machine-readable coverage data
- `coverage/v8-coverage.json` - V8 format coverage

## Writing New Tests

1. Create a new HTML file in `kitchensink/`:

```html
<!DOCTYPE html>
<html>
<head>
  <script src="../source/hyperElement.js"></script>
</head>
<body>
  <my-test-elem></my-test-elem>

  <script>
    customElements.define('my-test-elem', class extends hyperElement {
      render(Html) {
        Html`<div data-test-result="pass">Test passed!</div>`;
      }
    });
  </script>
</body>
</html>
```

2. The test runner automatically picks up new HTML files
3. Use `data-test-result="pass"` to indicate successful assertions
4. Use `data-test-result="fail"` to indicate failures

## Test Projects

Tests run in two parallel projects:

| Project | Description |
|---------|-------------|
| `source` | Tests against `/source/hyperElement.js` |
| `minified` | Tests against `/build/hyperElement.min.js` |

This ensures both the development source and production build work identically.

## Debugging Failed Tests

1. Run in UI mode: `npm run test:ui`
2. Check browser console output in the test report
3. Use headed mode to watch the test: `npm run test:headed`
4. Check `playwright-report/index.html` for detailed failure info

## Continuous Integration

Tests run automatically on GitHub Actions for:
- Every pull request
- Every push to main branch
- Release workflows

The CI must pass before merging any changes.
