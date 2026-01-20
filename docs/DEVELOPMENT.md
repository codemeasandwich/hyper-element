# Development Guide

This guide covers setting up the development environment for hyper-element.

## Prerequisites

- **Node.js** 20 or higher
- **npm** (comes with Node.js)

## Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/codemeasandwich/hyper-element.git
   cd hyper-element
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

   This also installs the pre-commit hooks automatically via the `prepare` script.

## Available Scripts

| Command               | Description                                       |
| --------------------- | ------------------------------------------------- |
| `npm run build`       | Build minified production bundle with source maps |
| `npm test`            | Run Playwright tests with coverage                |
| `npm run test:ui`     | Run tests with Playwright UI for debugging        |
| `npm run test:headed` | Run tests in headed browser mode                  |
| `npm run kitchensink` | Start local dev server for examples               |
| `npm run lint`        | Run ESLint to check for code issues               |
| `npm run format`      | Check Prettier formatting                         |
| `npm run format:fix`  | Auto-fix Prettier formatting issues               |
| `npm run release`     | Run the release script (maintainers only)         |

## Project Structure

```
hyper-element/
├── src/                     # Source files (ES modules)
│   ├── core/                # Core utilities
│   ├── attributes/          # Attribute handling
│   ├── template/            # Template processing
│   ├── html/                # HTML rendering
│   ├── lifecycle/           # Lifecycle hooks
│   └── hyperElement.js      # Main export
├── build/
│   ├── hyperElement.min.js  # Minified production build
│   └── hyperElement.min.js.map
├── kitchensink/             # Test suite
│   ├── kitchensink.spec.js  # Playwright test runner
│   └── *.html               # Test case files
├── example/                 # Example project
├── docs/                    # Documentation
├── .hooks/                  # Git hooks
│   ├── pre-commit           # Main hook orchestrator
│   ├── commit-msg           # Commit message validator
│   └── pre-commit.d/        # Modular validation scripts
└── scripts/
    └── publish.sh           # Release script
```

## Building

The build process uses [esbuild](https://esbuild.github.io/) for fast, minimal output:

```bash
npm run build
```

This produces:

- `build/hyperElement.min.js` - Minified bundle (~6.2 KB)
- `build/hyperElement.min.js.map` - Source map for debugging

## Pre-commit Hooks

The project uses a modular pre-commit hook system located in `.hooks/`. When you commit, the following checks run automatically:

1. **ESLint** - Code quality checks
2. **Prettier** - Code formatting
3. **Build** - Ensures the build succeeds
4. **Coverage** - Enforces 100% test coverage
5. **JSDoc** - Documentation validation
6. **Docs** - Documentation completeness

If any check fails, the commit is blocked until the issue is fixed.

### Installing Hooks Manually

If hooks weren't installed automatically:

```bash
npm run hooks:install
```

## Local Development Server

To run the examples locally:

```bash
npm run kitchensink
```

This starts a server at `http://localhost:5555` where you can view and test the kitchensink examples.

## Code Style

- **Prettier** for formatting (2-space indent, single quotes, trailing commas)
- **ESLint** for code quality
- All files are automatically checked on commit

Run formatting manually:

```bash
npm run format:fix
```

## Next Steps

- See [TESTING.md](TESTING.md) for testing documentation
- See [../CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines
