import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import type { Config } from "../config.js"
import { handleApiResponse, formatSuccessResponse } from "../api/api-utils.js"
import { KeysAPI } from "../api/keys-api.js"
import { listKeysInputSchema } from "../types.js"
import type { IGetKeysResponse } from "../types.js"
import { resolveProjectId, withErrorHandling } from "./tool-utils.js"

export function registerListKeys(server: McpServer, config: Config): void {
  const operation = "listing keys"

  server.registerTool(
    "list_keys",
    {
      description:
        "Search and list translation keys (i18n string identifiers) in the configured Texterify project. Returns keys with their current translations, tags, and pagination metadata. Use this to find key IDs needed by get_key, update_key, delete_keys, and set_translation. The response includes: `data` (array of keys with name, description, html_enabled, pluralization_enabled), `included` (translations with content per language, tags), and `meta.total` (total count for pagination). Search matches against key name, description, and translation content (case-insensitive).",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
      inputSchema: listKeysInputSchema,
    },
    withErrorHandling(operation, async (args) => {
      const result = resolveProjectId(args as { project_id?: string }, config)
      if (typeof result !== "string") return result

      const response = await KeysAPI.getKeys(config, result, {
        search: args.search as string | undefined,
        page: args.page as number | undefined,
        perPage: args.per_page as number | undefined,
        onlyUntranslated: args.only_untranslated as boolean | undefined,
      })
      const data = await handleApiResponse<IGetKeysResponse>(response, operation)
      return formatSuccessResponse(data)
    }),
  )
}
