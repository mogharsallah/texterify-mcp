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

  it("includes plural forms in translation object when provided", async () => {
    const fetchMock = mockFetchResponse(200, { data: { id: "t2" } })
    vi.stubGlobal("fetch", fetchMock)

    const translationBody = {
      key_id: "key-1",
      language_id: "lang-1",
      translation: {
        content: "item",
        zero: "no items",
        one: "one item",
        two: "two items",
        few: "a few items",
        many: "many items",
      },
    }

    await TranslationsAPI.createTranslation(testConfig, "proj-1", translationBody)

    const [, init] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(init.body as string)
    expect(body.translation.content).toBe("item")
    expect(body.translation.zero).toBe("no items")
    expect(body.translation.one).toBe("one item")
    expect(body.translation.two).toBe("two items")
    expect(body.translation.few).toBe("a few items")
    expect(body.translation.many).toBe("many items")
  })

  it("omits plural forms when not provided", async () => {
    const fetchMock = mockFetchResponse(200, { data: { id: "t3" } })
    vi.stubGlobal("fetch", fetchMock)

    await TranslationsAPI.createTranslation(testConfig, "proj-1", {
      key_id: "key-1",
      language_id: "lang-1",
      translation: { content: "Hello" },
    })

    const [, init] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(init.body as string)
    expect(body.translation).toEqual({ content: "Hello" })
    expect(body.translation.zero).toBeUndefined()
    expect(body.translation.one).toBeUndefined()
    expect(body.translation.two).toBeUndefined()
    expect(body.translation.few).toBeUndefined()
    expect(body.translation.many).toBeUndefined()
  })
})
