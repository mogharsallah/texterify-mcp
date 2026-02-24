import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import type { Config } from "../config.js"
import {
  handleApiResponse,
  formatSuccessResponse,
  hasBodyErrors,
  formatBodyErrorResponse,
  formatErrorResponse,
} from "../api/api-utils.js"
import { KeysAPI } from "../api/keys-api.js"
import { LanguagesAPI } from "../api/languages-api.js"
import { TranslationsAPI } from "../api/translations-api.js"
import { createKeyWithTranslationsInputSchema } from "../types.js"
import type { ICreateKeyResponse, IGetLanguagesResponse } from "../types.js"
import {
  resolveProjectId,
  withErrorHandling,
  buildCreateKeyBody,
  buildTranslationRecord,
} from "./tool-utils.js"

/**
 * Fetches all project languages and builds a map of language code → language ID.
 * Handles pagination when the project has more than 50 languages.
 */
async function fetchLanguageCodeMap(
  config: Config,
  projectId: string,
): Promise<Map<string, string>> {
  const codeToId = new Map<string, string>()
  let page = 1
  let fetched = 0

  while (true) {
    const response = await LanguagesAPI.getLanguages(config, projectId, {
      page,
      perPage: 50,
    })
    const data = await handleApiResponse<IGetLanguagesResponse>(response, "fetching languages")

    // Build a lookup of included language_code ID → code string
    const includedById = new Map<string, string>()
    for (const item of data.included) {
      includedById.set(item.id, item.attributes.code)
    }

    // Map each language's code → language ID
    for (const lang of data.data) {
      const langCodeRef = lang.relationships.language_code.data
      if (langCodeRef) {
        const code = includedById.get(langCodeRef.id)
        if (code) {
          codeToId.set(code, lang.id)
        }
      }
    }

    fetched += data.data.length
    if (fetched >= data.meta.total || data.data.length === 0) break
    page++
  }

  return codeToId
}

interface TranslationEntry {
  language_code: string
  content: string
  zero?: string
  one?: string
  two?: string
  few?: string
  many?: string
}

export function registerCreateKeyWithTranslations(server: McpServer, config: Config): void {
  const operation = "creating key with translations"

  server.registerTool(
    "create_key_with_translations",
    {
      description:
        "Create a new translation key and set translations for multiple languages in a single operation. " +
        "Accepts language codes (e.g., 'en', 'de', 'fr') instead of language IDs — the tool resolves " +
        "codes to IDs internally by fetching the project's configured languages. If the key is created " +
        "but any translation fails, the key is automatically rolled back (deleted). This combines " +
        "create_key + multiple set_translation calls into one atomic-like operation.",
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
      inputSchema: createKeyWithTranslationsInputSchema,
    },
    withErrorHandling(operation, async (args) => {
      const result = resolveProjectId(args as { project_id?: string }, config)
      if (typeof result !== "string") return result
      const projectId = result

      const translations = args.translations as TranslationEntry[]

      // 1. Fetch all project languages and build code → ID map
      const codeToId = await fetchLanguageCodeMap(config, projectId)

      // 2. Validate all provided language codes exist in the project
      const unknownCodes = translations
        .map((t) => t.language_code)
        .filter((code) => !codeToId.has(code))

      if (unknownCodes.length > 0) {
        const available = [...codeToId.keys()].sort().join(", ")
        return formatErrorResponse(
          new Error(
            `Unknown language code(s): ${unknownCodes.join(", ")}. ` +
              `Available codes in this project: ${available}`,
          ),
          operation,
        )
      }

      // 3. Create the key
      const keyBody = buildCreateKeyBody(args)

      const keyResponse = await KeysAPI.createKey(config, projectId, keyBody)
      const keyData = await handleApiResponse<ICreateKeyResponse>(keyResponse, "creating key")

      if (hasBodyErrors(keyData)) {
        return formatBodyErrorResponse(keyData, "creating key")
      }

      const keyId = keyData.data.id

      // 4. Set translations for each language
      const translationResults: unknown[] = []

      try {
        for (const entry of translations) {
          const languageId = codeToId.get(entry.language_code)!

          const translation = buildTranslationRecord(entry as unknown as Record<string, unknown>)

          const response = await TranslationsAPI.createTranslation(config, projectId, {
            key_id: keyId,
            language_id: languageId,
            translation,
          })
          const data = await handleApiResponse(
            response,
            `setting translation for '${entry.language_code}'`,
          )
          translationResults.push(data)
        }
      } catch (translationError) {
        // Roll back: delete the created key
        try {
          const deleteResponse = await KeysAPI.deleteKeys(config, projectId, [keyId])
          await handleApiResponse(deleteResponse, "rolling back key")
        } catch (rollbackError) {
          // Both translation and rollback failed — report both
          const translationMsg =
            translationError instanceof Error ? translationError.message : String(translationError)
          const rollbackMsg =
            rollbackError instanceof Error ? rollbackError.message : String(rollbackError)

          return formatErrorResponse(
            new Error(
              `Translation failed: ${translationMsg}. ` +
                `Additionally, rollback (key deletion) failed: ${rollbackMsg}. ` +
                `The key '${keyBody.name}' (ID: ${keyId}) was created but may have partial translations.`,
            ),
            operation,
          )
        }

        // Rollback succeeded — report the translation failure clearly
        const msg =
          translationError instanceof Error ? translationError.message : String(translationError)

        return formatErrorResponse(
          new Error(
            `${msg}. The key '${keyBody.name}' (ID: ${keyId}) has been rolled back (deleted).`,
          ),
          operation,
        )
      }

      // 5. Return combined success response
      return formatSuccessResponse({
        key: keyData,
        translations: translationResults,
      })
    }),
  )
}
