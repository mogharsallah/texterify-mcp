import { describe, it, expect, vi, afterEach } from "vitest"
import { LanguagesAPI } from "../../api/languages-api.js"
import { handleApiResponse, formatSuccessResponse } from "../../api/api-utils.js"
import { mockFetchResponse, testConfig } from "../helpers.js"

afterEach(() => vi.restoreAllMocks())

describe("list-languages tool", () => {
  it("builds URL with projects/proj-1/languages", async () => {
    const mockData = { data: [{ id: "lang-1", name: "English" }] }
    const fetchMock = mockFetchResponse(200, mockData)
    vi.stubGlobal("fetch", fetchMock)

    const response = await LanguagesAPI.getLanguages(testConfig, "proj-1")
    const data = await handleApiResponse(response, "listing languages")
    const result = formatSuccessResponse(data)

    const [url] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit]
    expect(url).toContain("projects/proj-1/languages")
    expect(result.content[0]!.type).toBe("text")
    expect(result.content[0]!.text).toBe(JSON.stringify(mockData, null, 2))
  })

  it("includes search query param when provided", async () => {
    const fetchMock = mockFetchResponse(200, { data: [] })
    vi.stubGlobal("fetch", fetchMock)

    await LanguagesAPI.getLanguages(testConfig, "proj-1", { search: "en" })

    const [url] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit]
    const parsed = new URL(url)
    expect(parsed.searchParams.get("search")).toBe("en")
  })
})
