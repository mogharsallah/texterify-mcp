# texterify-mcp

## 1.2.0

### Minor Changes

- Add elicitation-based user confirmation before write operations, refactor schema injection and tool registration, and fix CI publishing.
  - **feat:** Elicitation-based user confirmation before write operations (create, update, delete)
  - **refactor:** Inject input schemas via tool registration parameters instead of static imports
  - **refactor:** Replace static schema exports with `buildInputSchemas` factory
  - **refactor:** Migrate Claude configuration from opencode to claude
  - **fix(ci):** Use npm native OIDC trusted publishing; fix Node version and stale auth token
  - **chore:** Add `.nvmrc` for consistent Node.js version across environments

## 1.1.0

### Minor Changes

- Add MCP tool annotations, server metadata, and the new create_key_with_translations tool. Extract shared tool helpers to reduce duplication.
