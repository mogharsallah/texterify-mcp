# Architecture & MCP

## Project Structure

```
src/
  index.ts            # Server init, env validation, stdio transport setup
  config.ts           # Environment variable loading and validation
  types.ts            # Shared TypeScript types and Zod input schemas
  api/
    api.ts            # Core API client (base request logic via API object)
    api-utils.ts      # ApiError class, response handlers, body-error detection
    keys-api.ts       # Translation key CRUD endpoints
    languages-api.ts
    projects-api.ts
    translations-api.ts
  tools/              # One file per MCP tool (register function + handler)
    tool-utils.ts     # resolveProjectId() + withErrorHandling() wrapper
    list-keys.ts
    get-key.ts
    create-key.ts
    update-key.ts
    delete-keys.ts
    set-translation.ts
    list-languages.ts
    list-projects.ts
  __tests__/          # Vitest unit tests
    helpers.ts        # Shared testConfig + mockFetchResponse factory
    config.test.ts
    api.test.ts
    error-handling.test.ts
    response-formatting.test.ts
    tools/            # One test file per tool
      *.test.ts
```

## Tech Stack

- **Runtime:** Node.js (ESM -- `"type": "module"` in package.json)
- **Language:** TypeScript 5.9+ with strict mode
- **Runner:** tsx (no separate build step)
- **Key dependencies:** `@modelcontextprotocol/sdk` (MCP protocol), `zod` v4 (schema validation)

## MCP Server

- Server name: `texterify-mcp`, version read dynamically from `package.json`
- Transport: stdio only (stdin/stdout)
- **Never write non-MCP output to stdout** -- use `console.error()` or the MCP server's logging facility for debug output.
- Exactly 8 tools: `list_keys`, `get_key`, `create_key`, `update_key`, `delete_keys`, `set_translation`, `list_languages`, `list_projects`
- Each tool must have a human-readable description and a JSON Schema for its inputs.
- Use `@modelcontextprotocol/sdk`'s `McpServer` class and its `registerTool()` method (3-argument overload: name, metadata, handler) with Zod schemas for input validation.
- Each tool file exports a `register<ToolName>(server, config)` function called from `index.ts`.
- All Zod input schemas are defined centrally in `src/types.ts` and imported by tool files.
- Shared API logic (request building, auth headers, error formatting) lives in `src/api/`.

## Key Patterns

### Tool Utilities (`src/tools/tool-utils.ts`)

- **`resolveProjectId(args, config)`** -- Resolves project ID via fallback chain: tool `project_id` parameter -> `TEXTERIFY_PROJECT_ID` env var -> formatted error response. Returns either a string ID or a `ToolResponse` error.
- **`withErrorHandling(operation, handler)`** -- Higher-order function wrapping every tool handler in try/catch. Catches any thrown error and returns a formatted MCP error response with `isError: true`.

### API Utilities (`src/api/api-utils.ts`)

- **`ApiError`** -- Typed error class with `operation`, `statusCode`, `statusText`, `responseBody` fields. Thrown by `handleApiResponse()` for non-2xx statuses.
- **`handleApiResponse(response, operation)`** -- Parses a fetch `Response`. Returns parsed JSON on success, throws `ApiError` with context-specific messages for 403/404/other failures.
- **`formatSuccessResponse(data)`** / **`formatErrorResponse(error, operation)`** -- Create MCP `ToolResponse` objects with consistent formatting.
- **`hasBodyErrors(data)`** / **`formatBodyErrorResponse(data, operation)`** -- Handle Texterify's quirk of returning HTTP 200 with a non-empty `errors` object for validation failures (e.g., duplicate key name). Used by `create_key` and `update_key`.
