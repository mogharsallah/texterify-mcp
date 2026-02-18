import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import type { Config } from "../config.js"
import { handleApiResponse, formatSuccessResponse } from "../api/api-utils.js"
import { TranslationsAPI } from "../api/translations-api.js"
import { setTranslationInputSchema } from "../types.js"
import { resolveProjectId, withErrorHandling } from "./tool-utils.js"

export function registerSetTranslation(server: McpServer, config: Config): void {
  const operation = "setting translation"

  server.registerTool(
    "set_translation",
    {
      description:
        "Set the translated text for a specific key in a specific language (upsert). If a translation already exists for the key+language pair it is updated; otherwise a new translation is created. Requires both a key_id (from list_keys, get_key, or create_key) and a language_id (from list_languages). For keys with pluralization_enabled, provide plural forms alongside the main content — which forms to use depends on the target language's CLDR plural rules (check the language's supports_plural_* flags from list_languages). Typical workflow: list_languages to get language_id -> set_translation for each language.",
      inputSchema: setTranslationInputSchema,
    },
    withErrorHandling(operation, async (args) => {
      const result = resolveProjectId(args as { project_id?: string }, config)
      if (typeof result !== "string") return result

      const translation: Record<string, string> = { content: args.content as string }
      if (args.zero !== undefined) translation.zero = args.zero as string
      if (args.one !== undefined) translation.one = args.one as string
      if (args.two !== undefined) translation.two = args.two as string
      if (args.few !== undefined) translation.few = args.few as string
      if (args.many !== undefined) translation.many = args.many as string

      const body = {
        key_id: args.key_id as string,
        language_id: args.language_id as string,
        translation,
      }

      const response = await TranslationsAPI.createTranslation(config, result, body)
      const data = await handleApiResponse(response, operation)
      return formatSuccessResponse(data)
    }),
  )
}
