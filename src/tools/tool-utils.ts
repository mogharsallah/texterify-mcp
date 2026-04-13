import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import type { Config } from "../config.js"
import type { CreateKeyBody } from "../api/keys-api.js"
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
 * Builds a CreateKeyBody from tool args, picking only the fields that are present.
 */
export function buildCreateKeyBody(args: Record<string, unknown>): CreateKeyBody {
  const body: CreateKeyBody = { name: args.name as string }
  if (args.description !== undefined) body.description = args.description as string
  if (args.html_enabled !== undefined) body.html_enabled = args.html_enabled as boolean
  if (args.pluralization_enabled !== undefined)
    body.pluralization_enabled = args.pluralization_enabled as boolean
  return body
}

/**
 * Builds a translation record from tool args, including only the plural forms that are present.
 */
export function buildTranslationRecord(args: Record<string, unknown>): Record<string, string> {
  const translation: Record<string, string> = { content: args.content as string }
  if (args.zero !== undefined) translation.zero = args.zero as string
  if (args.one !== undefined) translation.one = args.one as string
  if (args.two !== undefined) translation.two = args.two as string
  if (args.few !== undefined) translation.few = args.few as string
  if (args.many !== undefined) translation.many = args.many as string
  return translation
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

/**
 * Asks the user for explicit confirmation via MCP elicitation before proceeding
 * with a write operation. Returns "proceed" if the user confirms or the client
 * doesn't support elicitation (backward-compatible fallback).
 */
export async function elicitConfirmation(
  server: McpServer,
  message: string,
): Promise<"proceed" | ToolResponse> {
  const capabilities = server.server.getClientCapabilities()
  if (!capabilities?.elicitation) return "proceed"

  const result = await server.server.elicitInput({
    message,
    requestedSchema: {
      type: "object",
      properties: {
        confirm: {
          type: "boolean",
          title: "Confirm",
          description: "Set to true to proceed with this operation",
        },
      },
      required: ["confirm"],
    },
  })

  if (result.action === "accept" && result.content?.confirm === true) {
    return "proceed"
  }

  return {
    content: [{ type: "text", text: "Operation cancelled by user." }],
  }
}
