import { describe, it, expect, vi, afterEach } from "vitest"
import { KeysAPI } from "../../api/keys-api.js"
import { LanguagesAPI } from "../../api/languages-api.js"
import { TranslationsAPI } from "../../api/translations-api.js"
import {
  handleApiResponse,
  formatSuccessResponse,
  hasBodyErrors,
  formatBodyErrorResponse,
  formatErrorResponse,
} from "../../api/api-utils.js"
import { mockFetchResponse, testConfig } from "../helpers.js"

afterEach(() => vi.restoreAllMocks())

// ── Helpers ─────────────────────────────────────────────────────

/** Builds a mock languages response with the given code → id pairs. */
function mockLanguagesResponse(languages: Array<{ id: string; code: string; langCodeId: string }>) {
  return {
    data: languages.map((l) => ({
      id: l.id,
      type: "language" as const,
      attributes: { id: l.id, name: l.code, is_default: false, progress: 0 },
      relationships: {
        country_code: { data: null },
        language_code: { data: { id: l.langCodeId, type: "language_code" as const } },
        parent: { data: null },
      },
    })),
    included: languages.map((l) => ({
      id: l.langCodeId,
      type: "language_code" as const,
      attributes: { id: l.langCodeId, name: l.code, code: l.code },
    })),
    meta: { total: languages.length },
  }
}

const sampleLanguages = [
  { id: "lang-en", code: "en", langCodeId: "lc-en" },
  { id: "lang-de", code: "de", langCodeId: "lc-de" },
  { id: "lang-fr", code: "fr", langCodeId: "lc-fr" },
]

const sampleKeyResponse = {
  data: { id: "key-new", type: "key", attributes: { name: "greeting" } },
  included: [],
}

// ── Tests ───────────────────────────────────────────────────────

describe("create-key-with-translations tool", () => {
  describe("language resolution", () => {
    it("fetches languages and resolves codes to IDs", async () => {
      const langData = mockLanguagesResponse(sampleLanguages)
      const calls: Array<{ url: string; init: RequestInit }> = []

      const fetchMock = vi.fn().mockImplementation((url: string, init: RequestInit) => {
        calls.push({ url, init })

        if (url.includes("/languages")) {
          return Promise.resolve(
            new Response(JSON.stringify(langData), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          )
        }
        if (url.includes("/keys") && init.method === "POST") {
          return Promise.resolve(
            new Response(JSON.stringify(sampleKeyResponse), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          )
        }
        // translations
        return Promise.resolve(
          new Response(JSON.stringify({ data: { id: "t1" } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        )
      })
      vi.stubGlobal("fetch", fetchMock)

      // Simulate the full flow: fetch languages, create key, set translations
      const langResponse = await LanguagesAPI.getLanguages(testConfig, "proj-1", {
        page: 1,
        perPage: 50,
      })
      const langResult = await handleApiResponse(langResponse, "fetching languages")

      expect(calls[0]!.url).toContain("projects/proj-1/languages")
      expect(langResult).toEqual(langData)
    })

    it("returns error for unknown language codes", async () => {
      const langData = mockLanguagesResponse(sampleLanguages)

      // Simulate language resolution: "en" exists, "xx" does not
      const codeToId = new Map<string, string>()
      for (const lang of langData.data) {
        const ref = lang.relationships.language_code.data
        if (ref) {
          const included = langData.included.find((i) => i.id === ref.id)
          if (included) codeToId.set(included.attributes.code, lang.id)
        }
      }

      const unknownCodes = ["xx", "yy"].filter((code) => !codeToId.has(code))
      expect(unknownCodes).toEqual(["xx", "yy"])

      const available = [...codeToId.keys()].sort().join(", ")
      const result = formatErrorResponse(
        new Error(
          `Unknown language code(s): ${unknownCodes.join(", ")}. ` +
            `Available codes in this project: ${available}`,
        ),
        "creating key with translations",
      )

      expect(result.isError).toBe(true)
      expect(result.content[0]!.text).toContain("Unknown language code(s): xx, yy")
      expect(result.content[0]!.text).toContain("de, en, fr")
    })
  })

  describe("key creation", () => {
    it("sends POST to create the key with all provided fields", async () => {
      const fetchMock = mockFetchResponse(200, sampleKeyResponse)
      vi.stubGlobal("fetch", fetchMock)

      const body = {
        name: "greeting",
        description: "A greeting message",
        html_enabled: true,
        pluralization_enabled: false,
      }

      const response = await KeysAPI.createKey(testConfig, "proj-1", body)
      const data = await handleApiResponse(response, "creating key")

      const [url, init] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [
        string,
        RequestInit,
      ]
      expect(url).toContain("projects/proj-1/keys")
      expect(init.method).toBe("POST")
      expect(JSON.parse(init.body as string)).toEqual(body)
      expect(data).toEqual(sampleKeyResponse)
    })

    it("detects body-level errors (e.g., name TAKEN) and returns error", async () => {
      const errorBody = {
        errors: { name: [{ error: "TAKEN" }] },
        data: null,
        included: [],
      }
      const fetchMock = mockFetchResponse(200, errorBody)
      vi.stubGlobal("fetch", fetchMock)

      const response = await KeysAPI.createKey(testConfig, "proj-1", { name: "duplicate" })
      const data = await handleApiResponse(response, "creating key")

      expect(hasBodyErrors(data)).toBe(true)
      const result = formatBodyErrorResponse(data, "creating key")
      expect(result.isError).toBe(true)
      expect(result.content[0]!.text).toBe("Error creating key: name: TAKEN")
    })
  })

  describe("translation setting", () => {
    it("calls createTranslation for each language with resolved IDs", async () => {
      const calls: Array<{ url: string; body: unknown }> = []

      const fetchMock = vi.fn().mockImplementation((url: string, init: RequestInit) => {
        const body = init.body ? JSON.parse(init.body as string) : null
        calls.push({ url, body })

        return Promise.resolve(
          new Response(JSON.stringify({ data: { id: `t-${calls.length}` } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        )
      })
      vi.stubGlobal("fetch", fetchMock)

      const translations = [
        { languageId: "lang-en", languageCode: "en", content: "Hello" },
        { languageId: "lang-de", languageCode: "de", content: "Hallo" },
      ]

      for (const t of translations) {
        await TranslationsAPI.createTranslation(testConfig, "proj-1", {
          key_id: "key-new",
          language_id: t.languageId,
          translation: { content: t.content },
        })
      }

      expect(calls).toHaveLength(2)
      expect(calls[0]!.url).toContain("projects/proj-1/translations")
      expect(calls[0]!.body).toEqual({
        key_id: "key-new",
        language_id: "lang-en",
        translation: { content: "Hello" },
      })
      expect(calls[1]!.body).toEqual({
        key_id: "key-new",
        language_id: "lang-de",
        translation: { content: "Hallo" },
      })
    })

    it("includes plural forms in translation body when provided", async () => {
      const fetchMock = mockFetchResponse(200, { data: { id: "t1" } })
      vi.stubGlobal("fetch", fetchMock)

      await TranslationsAPI.createTranslation(testConfig, "proj-1", {
        key_id: "key-new",
        language_id: "lang-en",
        translation: {
          content: "items",
          zero: "no items",
          one: "one item",
          few: "a few items",
          many: "many items",
        },
      })

      const [, init] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [
        string,
        RequestInit,
      ]
      const body = JSON.parse(init.body as string)
      expect(body.translation).toEqual({
        content: "items",
        zero: "no items",
        one: "one item",
        few: "a few items",
        many: "many items",
      })
    })
  })

  describe("rollback on translation failure", () => {
    it("deletes the key when a translation request fails", async () => {
      const calls: Array<{ url: string; method: string; body: unknown }> = []
      let translationCallCount = 0

      const fetchMock = vi.fn().mockImplementation((url: string, init: RequestInit) => {
        const method = init.method ?? "GET"
        const body = init.body ? JSON.parse(init.body as string) : null
        calls.push({ url, method, body })

        // Simulate: first translation succeeds, second fails
        if (url.includes("/translations") && method === "POST") {
          translationCallCount++
          if (translationCallCount === 2) {
            return Promise.resolve(
              new Response("Internal Server Error", {
                status: 500,
                statusText: "Internal Server Error",
                headers: { "Content-Type": "application/json" },
              }),
            )
          }
          return Promise.resolve(
            new Response(JSON.stringify({ data: { id: "t1" } }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          )
        }

        // DELETE for rollback
        if (method === "DELETE") {
          return Promise.resolve(
            new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          )
        }

        return Promise.resolve(
          new Response(JSON.stringify({}), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        )
      })
      vi.stubGlobal("fetch", fetchMock)

      // First translation succeeds
      const r1 = await TranslationsAPI.createTranslation(testConfig, "proj-1", {
        key_id: "key-new",
        language_id: "lang-en",
        translation: { content: "Hello" },
      })
      const d1 = await handleApiResponse(r1, "setting translation for 'en'")
      expect(d1).toEqual({ data: { id: "t1" } })

      // Second translation fails
      const r2 = await TranslationsAPI.createTranslation(testConfig, "proj-1", {
        key_id: "key-new",
        language_id: "lang-de",
        translation: { content: "Hallo" },
      })
      await expect(handleApiResponse(r2, "setting translation for 'de'")).rejects.toThrow()

      // Rollback: delete the key
      const deleteResponse = await KeysAPI.deleteKeys(testConfig, "proj-1", ["key-new"])
      const deleteResult = await handleApiResponse(deleteResponse, "rolling back key")
      expect(deleteResult).toEqual({ success: true })

      // Verify the DELETE was called with the correct key
      const deleteCall = calls.find((c) => c.method === "DELETE")
      expect(deleteCall).toBeDefined()
      expect(deleteCall!.url).toContain("projects/proj-1/keys")
      expect(deleteCall!.body).toEqual({ keys: ["key-new"] })
    })

    it("reports both failures when rollback also fails", async () => {
      const translationMsg = "500 Internal Server Error — oops"
      const rollbackMsg = "403 Forbidden — not allowed"

      const result = formatErrorResponse(
        new Error(
          `Translation failed: ${translationMsg}. ` +
            `Additionally, rollback (key deletion) failed: ${rollbackMsg}. ` +
            `The key 'greeting' (ID: key-new) was created but may have partial translations.`,
        ),
        "creating key with translations",
      )

      expect(result.isError).toBe(true)
      expect(result.content[0]!.text).toContain("Translation failed:")
      expect(result.content[0]!.text).toContain("rollback (key deletion) failed:")
      expect(result.content[0]!.text).toContain("key-new")
    })
  })

  describe("success response", () => {
    it("returns combined key + translations data on full success", async () => {
      const keyData = sampleKeyResponse
      const translationResults = [{ data: { id: "t-en" } }, { data: { id: "t-de" } }]

      const result = formatSuccessResponse({
        key: keyData,
        translations: translationResults,
      })

      expect(result.isError).toBeUndefined()
      const parsed = JSON.parse(result.content[0]!.text)
      expect(parsed.key).toEqual(keyData)
      expect(parsed.translations).toHaveLength(2)
      expect(parsed.translations[0].data.id).toBe("t-en")
      expect(parsed.translations[1].data.id).toBe("t-de")
    })
  })

  describe("pagination", () => {
    it("fetches multiple pages when total exceeds per_page", async () => {
      const page1Languages = [
        { id: "lang-1", code: "en", langCodeId: "lc-1" },
        { id: "lang-2", code: "de", langCodeId: "lc-2" },
      ]
      const page2Languages = [{ id: "lang-3", code: "fr", langCodeId: "lc-3" }]

      const page1Data = {
        ...mockLanguagesResponse(page1Languages),
        meta: { total: 3 },
      }
      const page2Data = mockLanguagesResponse(page2Languages)

      let callCount = 0
      const fetchMock = vi.fn().mockImplementation(() => {
        callCount++
        const data = callCount === 1 ? page1Data : page2Data
        return Promise.resolve(
          new Response(JSON.stringify(data), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        )
      })
      vi.stubGlobal("fetch", fetchMock)

      // Fetch page 1
      const r1 = await LanguagesAPI.getLanguages(testConfig, "proj-1", { page: 1, perPage: 2 })
      const d1 = await handleApiResponse(r1, "fetching languages")

      // Fetch page 2
      const r2 = await LanguagesAPI.getLanguages(testConfig, "proj-1", { page: 2, perPage: 2 })
      const d2 = await handleApiResponse(r2, "fetching languages")

      // Build combined code map
      const codeToId = new Map<string, string>()
      for (const pageData of [d1, d2] as Array<{
        data: Array<{
          id: string
          relationships: {
            language_code: { data: { id: string; type: string } | null }
          }
        }>
        included: Array<{ id: string; attributes: { code: string } }>
      }>) {
        const includedById = new Map<string, string>()
        for (const item of pageData.included) {
          includedById.set(item.id, item.attributes.code)
        }
        for (const lang of pageData.data) {
          const ref = lang.relationships.language_code.data
          if (ref) {
            const code = includedById.get(ref.id)
            if (code) codeToId.set(code, lang.id)
          }
        }
      }

      expect(codeToId.size).toBe(3)
      expect(codeToId.get("en")).toBe("lang-1")
      expect(codeToId.get("de")).toBe("lang-2")
      expect(codeToId.get("fr")).toBe("lang-3")
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
  })
})
