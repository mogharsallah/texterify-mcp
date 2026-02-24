import { describe, it, expect, vi, afterEach } from "vitest"
import { TranslationsAPI } from "../../api/translations-api.js"
import { handleApiResponse, formatSuccessResponse } from "../../api/api-utils.js"
import { mockFetchResponse, testConfig } from "../helpers.js"

afterEach(() => vi.restoreAllMocks())

describe("set-translation tool", () => {
  it("sends POST with content only in translation body", async () => {
    const mockData = { data: { id: "t1" } }
    const fetchMock = mockFetchResponse(200, mockData)
    vi.stubGlobal("fetch", fetchMock)

    const translationBody = {
      key_id: "key-1",
      language_id: "lang-1",
      translation: { content: "Hello" },
    }

    const response = await TranslationsAPI.createTranslation(testConfig, "proj-1", translationBody)
    const data = await handleApiResponse(response, "setting translation")
    const result = formatSuccessResponse(data)

    const [url, init] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ]
    expect(url).toContain("projects/proj-1/translations")
    expect(init.method).toBe("POST")
    expect(JSON.parse(init.body as string)).toEqual({
      key_id: "key-1",
      language_id: "lang-1",
      translation: { content: "Hello" },
    })
    expect(result.content[0]!.text).toBe(JSON.stringify(mockData, null, 2))
  })
})
