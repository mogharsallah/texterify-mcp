export interface ToolResponse {
  [key: string]: unknown
  content: Array<{ type: "text"; text: string }>
  isError?: true
}

export class ApiError extends Error {
  constructor(
    public readonly operation: string,
    public readonly statusCode: number | null,
    public readonly statusText: string,
    public readonly responseBody: string,
  ) {
    super(`${operation}: ${responseBody}`)
    this.name = "ApiError"
  }
}

export async function handleApiResponse<T = unknown>(
  response: Response,
  operation: string,
): Promise<T> {
  if (response.ok) {
    const text = await response.text()
    return (text ? JSON.parse(text) : null) as T
  }

  const body = await response.text()

  if (response.status === 403) {
    throw new ApiError(
      operation,
      403,
      "Forbidden",
      `Authentication failed (403). Check TEXTERIFY_AUTH_EMAIL and TEXTERIFY_AUTH_SECRET. Response: ${body}`,
    )
  }

  if (response.status === 404) {
    throw new ApiError(
      operation,
      404,
      "Not Found",
      `The requested resource was not found (404). Response: ${body}`,
    )
  }

  throw new ApiError(
    operation,
    response.status,
    response.statusText,
    `${response.status} ${response.statusText} — ${body}`,
  )
}

export function formatSuccessResponse(data: unknown): ToolResponse {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  }
}

export function formatErrorResponse(error: unknown, operation: string): ToolResponse {
  let message: string
  if (error instanceof ApiError) {
    message = error.responseBody
  } else if (error instanceof Error) {
    message = `Network error — ${error.message}`
  } else {
    message = String(error)
  }
  return {
    content: [{ type: "text", text: `Error ${operation}: ${message}` }],
    isError: true,
  }
}

/**
 * Checks whether a parsed API response contains body-level validation errors.
 * The Texterify API returns HTTP 200 with a non-empty `errors` field for
 * validation failures (e.g., duplicate key name → { errors: { name: [{ error: "TAKEN" }] } }).
 */
export function hasBodyErrors(data: unknown): boolean {
  if (data === null || typeof data !== "object") return false
  const obj = data as Record<string, unknown>
  return (
    obj.errors !== undefined &&
    obj.errors !== null &&
    typeof obj.errors === "object" &&
    Object.keys(obj.errors as object).length > 0
  )
}

/**
 * Formats body-level validation errors from an API response into an MCP error response.
 * Extracts field names and error codes from the `errors` object.
 *
 * Example: { errors: { name: [{ error: "TAKEN" }] } }
 *        → "Error creating key: name: TAKEN"
 */
export function formatBodyErrorResponse(data: unknown, operation: string): ToolResponse {
  const errors = (data as Record<string, unknown>).errors as Record<
    string,
    Array<{ error: string }>
  >
  const parts: string[] = []
  for (const [field, fieldErrors] of Object.entries(errors)) {
    for (const e of fieldErrors) {
      parts.push(`${field}: ${e.error}`)
    }
  }
  return {
    content: [{ type: "text", text: `Error ${operation}: ${parts.join(", ")}` }],
    isError: true,
  }
}
