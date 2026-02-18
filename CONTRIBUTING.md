# Contributing to texterify-mcp

Thanks for your interest in contributing! This guide will help you get set up.

## Prerequisites

- **Node.js** >= 18
- **pnpm** (install via `corepack enable` or `npm install -g pnpm`)

## Development Setup

```sh
# Clone the repository
git clone https://github.com/mogharsallah/texterify-mcp.git
cd texterify-mcp

# Install dependencies
pnpm install

# Set up environment variables (for manual testing)
cp .env.example .env  # then fill in your Texterify credentials
```

## Development Workflow

```sh
# Run the server in watch mode
pnpm dev

# Run the test suite
pnpm test

# Type-check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format
```

## Code Style

Code style is enforced automatically:

- **ESLint** for linting (`pnpm lint`)
- **Prettier** for formatting (`pnpm format`)
- **Pre-commit hooks** run lint-staged on every commit (via husky)

You don't need to worry about formatting manually -- it happens automatically on commit.

## Submitting a Pull Request

1. Fork the repository and create your branch from `main`
2. Make your changes
3. Add a changeset describing your change:
   ```sh
   pnpm changeset
   ```
   This will prompt you to describe the change and select a version bump type (patch, minor, major).
4. Ensure all checks pass:
   ```sh
   pnpm test
   pnpm lint
   pnpm format:check
   pnpm typecheck
   ```
5. Open a pull request against `main`

## Changesets

This project uses [changesets](https://github.com/changesets/changesets) for version management. Every PR that changes user-facing behavior should include a changeset. The changeset describes what changed and determines the version bump.

- **patch** -- bug fixes, documentation
- **minor** -- new features, non-breaking changes
- **major** -- breaking changes

If your PR is purely internal (CI config, dev tooling, etc.), a changeset is not required.
