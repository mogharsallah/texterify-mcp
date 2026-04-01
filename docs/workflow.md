# Workflow (Git, Testing, Linting)

## Git & Commits

- The repository is on the `main` branch.
- Write concise commit messages focused on "why" not "what".
- Do not commit `.env` files or any file containing secrets.

## Task Runner

A `justfile` provides common recipes as an alternative to raw pnpm commands: `install`, `start`, `dev`, `check` (tsc --noEmit), `test`, `test-watch`, `test-file`.

## Testing

- **Framework:** Vitest v4 (`pnpm test` runs `vitest run`)
- No separate vitest config file -- uses defaults from `tsconfig.json`.
- Tests live in `src/__tests__/` with tool-specific tests in `src/__tests__/tools/`.
- Shared test utilities in `src/__tests__/helpers.ts` -- exports `testConfig` and `mockFetchResponse()` factory.
- 12 test files covering: config validation, API client, error handling, response formatting, and all 8 tool handlers.
- Mock the `fetch` API via `vi.stubGlobal("fetch", ...)` for Texterify HTTP calls -- do not make real API requests.

## Linting & Formatting

No linter or formatter is currently configured. If adding one:

- Prefer Biome or ESLint flat config with `@typescript-eslint`.
- Run `tsc --noEmit` as the primary type-checking gate.
