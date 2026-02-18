import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import type { Config } from "../config.js"
import { handleApiResponse, formatSuccessResponse } from "../api/api-utils.js"
import { KeysAPI } from "../api/keys-api.js"
import { getKeyInputSchema } from "../types.js"
import type { IGetKeyResponse } from "../types.js"
import { resolveProjectId, withErrorHandling } from "./tool-utils.js"

export function registerGetKey(server: McpServer, config: Config): void {
  const operation = "getting key"

  server.registerTool(
    "get_key",
    {
      description:
        "Retrieve a single translation key with all its translations across every project language, plus related tags and placeholders. Use this to inspect the complete translation state of a specific key before updating or to verify translations after setting them. The response includes: `data` (the key with name, description, html_enabled, pluralization_enabled), `included` (all translations with their content and language info, tags, placeholders). Requires a key_id — use list_keys to find it.",
      inputSchema: getKeyInputSchema,
    },
    withErrorHandling(operation, async (args) => {
      const result = resolveProjectId(args as { project_id?: string }, config)
      if (typeof result !== "string") return result

      const response = await KeysAPI.getKey(config, result, args.key_id as string)
      const data = await handleApiResponse<IGetKeyResponse>(response, operation)
      return formatSuccessResponse(data)
    }),
  )
}
