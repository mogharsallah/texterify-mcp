# API & Error Handling Patterns

## Environment Variables

Required (server must validate at startup and exit with all missing names):

- `TEXTERIFY_AUTH_EMAIL`
- `TEXTERIFY_AUTH_SECRET`

Optional with defaults:

- `TEXTERIFY_PROJECT_ID` -- Can be set as an environment variable or provided per-tool via the `project_id` parameter. Resolution order: tool parameter -> environment variable -> error. Users can find their project ID in the project's `texterify.json` file or by using the `list_projects` tool.
- `TEXTERIFY_API_BASE_URL` -- default: `https://app.texterify.com/api`
- `TEXTERIFY_API_VERSION` -- default: `v1`

API URL pattern: `{base_url}/{version}/{path}`

## API Authentication

Every request to Texterify must include:

- `Auth-Email` header (from `TEXTERIFY_AUTH_EMAIL`)
- `Auth-Secret` header (from `TEXTERIFY_AUTH_SECRET`)
- `Content-Type: application/json`
- `Accept: application/json`

## API Client (`src/api/api.ts`)

The `API` object provides typed methods for all HTTP verbs. All methods accept a `Config` object and return a raw `Response`:

- `API.getRequest(config, path, queryParams?, signal?)` -- GET with optional query params and abort signal
- `API.postRequest(config, path, body?)` -- POST with JSON body
- `API.putRequest(config, path, body?)` -- PUT with JSON body
- `API.deleteRequest(config, path, body?)` -- DELETE with JSON body

Internally, these build the URL as `{apiBaseUrl}/{apiVersion}/{path}`, attach auth headers, and call native `fetch`.

## Error Handling

- **Never throw unhandled exceptions** -- the MCP server must not crash.
- All tool handlers are wrapped with `withErrorHandling(operation, handler)` which catches any thrown error and returns a formatted MCP error response.
- API-layer functions use `handleApiResponse()` which throws typed `ApiError` instances for non-2xx responses.
- `formatErrorResponse(error, operation)` converts errors to MCP responses with `isError: true` and a human-readable message prefixed with the failed operation.

### `ApiError` Class

Typed error with structured fields for programmatic handling:

- `operation` -- what was being attempted (e.g., `"listing keys"`)
- `statusCode` -- HTTP status code (or `null` for network errors)
- `statusText` -- HTTP status text
- `responseBody` -- raw response body for debugging

### HTTP Status Handling (via `handleApiResponse()`)

- **403:** Throws `ApiError` suggesting the user check `TEXTERIFY_AUTH_EMAIL` and `TEXTERIFY_AUTH_SECRET`.
- **404:** Throws `ApiError` indicating the resource was not found.
- **Other non-2xx:** Throws `ApiError` with status code, status text, and response body.
- **Network errors:** Caught by `withErrorHandling()`, returned as a descriptive message without exposing stack traces.

### Example (Tool Handler Pattern)

```typescript
import { API } from "../api/api.js"
import { handleApiResponse, formatSuccessResponse } from "../api/api-utils.js"
import { resolveProjectId, withErrorHandling } from "./tool-utils.js"

// Inside a tool registration:
server.registerTool(
  "list_keys",
  { description, inputSchema },
  withErrorHandling("listing keys", async (args) => {
    const projectId = resolveProjectId(args, config)
    if (typeof projectId !== "string") return projectId // error response

    const response = await API.getRequest(config, `projects/${projectId}/keys`)
    const data = await handleApiResponse(response, "listing keys")
    return formatSuccessResponse(data)
  }),
)
```

### Body-Level Error Detection

Texterify returns HTTP 200 with a non-empty `errors` object for validation failures (e.g., duplicate key name returns `{ errors: { name: [{ error: "TAKEN" }] } }`).

- **`hasBodyErrors(data)`** -- Checks whether a parsed response contains body-level validation errors.
- **`formatBodyErrorResponse(data, operation)`** -- Extracts field names and error codes into a human-readable MCP error response.

Used by `create_key` and `update_key` after a successful HTTP response:

```typescript
const data = await handleApiResponse(response, "creating key")
if (hasBodyErrors(data)) {
  return formatBodyErrorResponse(data, "creating key")
}
return formatSuccessResponse(data)
```

## Response Formatting

- Successful responses: JSON stringified with 2-space indentation inside an MCP text content block.
- Error responses: `isError: true` with a single text content block.
- Empty response bodies (e.g., DELETE): return a human-readable confirmation string like `"Keys deleted successfully."`.
- Always include the full JSON:API response (`data`, `included`, `meta`) -- do not strip or reshape it.
