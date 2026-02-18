import { describe, it, expect, vi, afterEach } from "vitest"
import { KeysAPI } from "../../api/keys-api.js"
import { handleApiResponse, formatSuccessResponse } from "../../api/api-utils.js"
import { mockFetchResponse, testConfig } from "../helpers.js"

afterEach(() => vi.restoreAllMocks())

describe("list-keys tool", () => {
  it("returns 2-space indented JSON with content[0].type 'text'", async () => {
    const mockData = {
      data: [
        { id: "k1", name: "key_one" },
        { id: "k2", name: "key_two" },
      ],
    }
    const fetchMock = mockFetchResponse(200, mockData)
    vi.stubGlobal("fetch", fetchMock)

    const response = await KeysAPI.getKeys(testConfig, "proj-1")
    const data = await handleApiResponse(response, "listing keys")
    const result = formatSuccessResponse(data)

    expect(result.content[0]!.type).toBe("text")
    expect(result.content[0]!.text).toBe(JSON.stringify(mockData, null, 2))
    expect(result.isError).toBeUndefined()
  })

  it("builds URL with projects/proj-1/keys", async () => {
    const fetchMock = mockFetchResponse(200, { data: [] })
    vi.stubGlobal("fetch", fetchMock)

    await KeysAPI.getKeys(testConfig, "proj-1")

    const [url] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit]
    expect(url).toContain("projects/proj-1/keys")
  })

  it("includes search query param when provided", async () => {
    const fetchMock = mockFetchResponse(200, { data: [] })
    vi.stubGlobal("fetch", fetchMock)

    await KeysAPI.getKeys(testConfig, "proj-1", { search: "welcome" })

    const [url] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit]
    const parsed = new URL(url)
    expect(parsed.searchParams.get("search")).toBe("welcome")
  })
})
