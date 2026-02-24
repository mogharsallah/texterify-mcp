import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import type { Config } from "../config.js"
import {
  handleApiResponse,
  formatSuccessResponse,
  hasBodyErrors,
  formatBodyErrorResponse,
} from "../api/api-utils.js"
import { KeysAPI, type UpdateKeyBody } from "../api/keys-api.js"
import { updateKeyInputSchema } from "../types.js"
import { resolveProjectId, withErrorHandling } from "./tool-utils.js"

export function registerUpdateKey(server: McpServer, config: Config): void {
  const operation = "updating key"

  server.registerTool(
    "update_key",
    {
      description:
        'Update an existing translation key\'s metadata: name, description, or HTML/pluralization settings. Only the fields you provide are changed — omitted fields stay as-is. Important: this does NOT modify translations. Use set_translation to change translated content. Returns { "message": "Key updated" } on success (not the full key object — call get_key afterward if you need the updated key data).',
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
      inputSchema: updateKeyInputSchema,
    },
    withErrorHandling(operation, async (args) => {
      const result = resolveProjectId(args as { project_id?: string }, config)
      if (typeof result !== "string") return result

      const body: UpdateKeyBody = {}
      if (args.name !== undefined) body.name = args.name as string
      if (args.description !== undefined) body.description = args.description as string
      if (args.html_enabled !== undefined) body.html_enabled = args.html_enabled as boolean
      if (args.pluralization_enabled !== undefined)
        body.pluralization_enabled = args.pluralization_enabled as boolean

      const response = await KeysAPI.updateKey(config, result, args.key_id as string, body)
      const data = await handleApiResponse(response, operation)
      if (hasBodyErrors(data)) {
        return formatBodyErrorResponse(data, operation)
      }
      return formatSuccessResponse(data)
    }),
  )
}
