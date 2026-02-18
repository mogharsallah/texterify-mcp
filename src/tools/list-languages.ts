import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import type { Config } from "../config.js"
import { handleApiResponse, formatSuccessResponse } from "../api/api-utils.js"
import { LanguagesAPI } from "../api/languages-api.js"
import { listLanguagesInputSchema } from "../types.js"
import type { IGetLanguagesResponse } from "../types.js"
import { resolveProjectId, withErrorHandling } from "./tool-utils.js"

export function registerListLanguages(server: McpServer, config: Config): void {
  const operation = "listing languages"

  server.registerTool(
    "list_languages",
    {
      description:
        "List languages configured in the Texterify project. Use this to get language IDs required by set_translation and to check translation progress per language. The response includes: `data` (languages with name, is_default flag, progress as 0-100 percentage of translated keys, and supports_plural_* flags indicating which CLDR plural forms apply), `included` (country_code and language_code with their codes), and `meta.total`. The language marked is_default is the primary language of the project.",
      inputSchema: listLanguagesInputSchema,
    },
    withErrorHandling(operation, async (args) => {
      const result = resolveProjectId(args as { project_id?: string }, config)
      if (typeof result !== "string") return result

      const response = await LanguagesAPI.getLanguages(config, result, {
        search: args.search as string | undefined,
        page: args.page as number | undefined,
        perPage: args.per_page as number | undefined,
      })
      const data = await handleApiResponse<IGetLanguagesResponse>(response, operation)
      return formatSuccessResponse(data)
    }),
  )
}
