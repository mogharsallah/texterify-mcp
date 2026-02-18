import type { Config } from "../config.js"
import { formatErrorResponse, type ToolResponse } from "../api/api-utils.js"

/**
 * Resolves the project ID from tool args or config.
 * Returns the ID string on success, or a ToolResponse error if neither source provides one.
 */
export function resolveProjectId(
  args: { project_id?: string },
  config: Config,
): string | ToolResponse {
  const projectId = args.project_id ?? config.projectId
  if (!projectId) {
    return formatErrorResponse(
      new Error(
        "project_id is required — provide it as a parameter or set TEXTERIFY_PROJECT_ID. " +
          "You can find this value in the project's texterify.json file.",
      ),
      "resolving project",
    )
  }
  return projectId
}

/**
 * Wraps a tool handler with uniform error handling.
 * Catches any thrown error and returns a formatted MCP error response.
 */
export function withErrorHandling(
  operation: string,
  handler: (args: Record<string, unknown>) => Promise<ToolResponse>,
): (args: Record<string, unknown>) => Promise<ToolResponse> {
  return async (args) => {
    try {
      return await handler(args)
    } catch (error) {
      return formatErrorResponse(error, operation)
    }
  }
}
