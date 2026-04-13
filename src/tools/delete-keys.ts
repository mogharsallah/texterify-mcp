import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import type { Config } from "../config.js"
import { handleApiResponse, formatSuccessResponse } from "../api/api-utils.js"
import { KeysAPI } from "../api/keys-api.js"
import type { InputSchemas } from "../types.js"
import { resolveProjectId, withErrorHandling, elicitConfirmation } from "./tool-utils.js"

export function registerDeleteKeys(
  server: McpServer,
  config: Config,
  inputSchema: InputSchemas["deleteKeys"],
): void {
  const operation = "deleting keys"

  server.registerTool(
    "delete_keys",
    {
      description:
        'Permanently delete one or more translation keys and ALL their associated translations from the configured Texterify project. This action is irreversible — the keys, all their translations across every language, and any tag associations are destroyed. Returns { "message": "Keys deleted" } on success. Use list_keys first to verify which keys you are deleting.',
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
      inputSchema,
    },
    withErrorHandling(operation, async (args) => {
      const result = resolveProjectId(args as { project_id?: string }, config)
      if (typeof result !== "string") return result

      const keyIds = args.key_ids as string[]
      const confirmation = await elicitConfirmation(
        server,
        `Permanently delete ${keyIds.length} key(s) and ALL their translations? This is irreversible.`,
      )
      if (confirmation !== "proceed") return confirmation

      const response = await KeysAPI.deleteKeys(config, result, keyIds)
      const data = await handleApiResponse(response, operation)
      return formatSuccessResponse(data)
    }),
  )
}
