# Contributing to hyper-element

Thank you for your interest in contributing to hyper-element!

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/codemeasandwich/hyper-element/issues)
2. If not, create a new issue with:
   - A clear, descriptive title
   - Steps to reproduce the bug
   - Expected vs actual behavior
   - Browser and version information

### Suggesting Features

Open an issue with the `enhancement` label describing:
- The use case for the feature
- How it would work
- Any potential drawbacks

### Submitting Changes

1. Fork the repository
2. Create a feature branch from `master`:
   ```bash
   git checkout -b feature/my-feature
   ```
3. Make your changes
4. Ensure all tests pass with 100% coverage:
   ```bash
   npm test
   ```
5. Commit using [Conventional Commits](https://www.conventionalcommits.org/) format:
   ```bash
   git commit -m "feat: add new feature"
   ```
6. Push to your fork:
   ```bash
   git push origin feature/my-feature
   ```
7. Open a Pull Request

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/). Each commit message must follow this format:

```
<type>: <description>
```

### Types

| Type | Description |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, semicolons, etc.) |
| `refactor` | Code changes that neither fix bugs nor add features |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `build` | Build system or dependency changes |
| `ci` | CI configuration changes |
| `chore` | Other changes that don't modify src or test files |

### Breaking Changes

For breaking changes, add `!` after the type:
```bash
git commit -m "feat!: remove deprecated API"
```

## Code Style

- Code is automatically formatted with [Prettier](https://prettier.io/)
- Linting is enforced with [ESLint](https://eslint.org/)
- Run `npm run format:fix` to auto-fix formatting issues
- Run `npm run lint` to check for linting errors

## Testing Requirements

- All tests must pass
- **100% code coverage is required** (statements, branches, lines, functions)
- Tests are written using [Playwright](https://playwright.dev/)
- Add tests for any new functionality

See [docs/TESTING.md](docs/TESTING.md) for detailed testing instructions.

## Development Setup

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for setup instructions.

## Questions?

Open an issue or reach out to the maintainers.
