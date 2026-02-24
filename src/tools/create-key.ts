import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import type { Config } from "../config.js"
import {
  handleApiResponse,
  formatSuccessResponse,
  hasBodyErrors,
  formatBodyErrorResponse,
} from "../api/api-utils.js"
import { KeysAPI, type CreateKeyBody } from "../api/keys-api.js"
import { createKeyInputSchema } from "../types.js"
import type { ICreateKeyResponse } from "../types.js"
import { resolveProjectId, withErrorHandling } from "./tool-utils.js"

export function registerCreateKey(server: McpServer, config: Config): void {
  const operation = "creating key"

  server.registerTool(
    "create_key",
    {
      description:
        'Create a new translation key (i18n string identifier) in the configured Texterify project. This only creates the key entry — it does NOT add any translated content. After creating a key, call set_translation for each language to add translations. Key names must be unique within the project; duplicate names return a validation error with code "TAKEN". Typical workflow: create_key -> list_languages -> set_translation for each language.',
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
      inputSchema: createKeyInputSchema,
    },
    withErrorHandling(operation, async (args) => {
      const result = resolveProjectId(args as { project_id?: string }, config)
      if (typeof result !== "string") return result

      const body: CreateKeyBody = { name: args.name as string }
      if (args.description !== undefined) body.description = args.description as string
      if (args.html_enabled !== undefined) body.html_enabled = args.html_enabled as boolean
      if (args.pluralization_enabled !== undefined)
        body.pluralization_enabled = args.pluralization_enabled as boolean

      const response = await KeysAPI.createKey(config, result, body)
      const data = await handleApiResponse<ICreateKeyResponse>(response, operation)
      if (hasBodyErrors(data)) {
        return formatBodyErrorResponse(data, operation)
      }
      return formatSuccessResponse(data)
    }),
  )
}
