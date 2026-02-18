import { describe, it, expect, vi, afterEach } from "vitest"
import { KeysAPI } from "../../api/keys-api.js"
import { handleApiResponse, formatSuccessResponse } from "../../api/api-utils.js"
import { mockFetchResponse, testConfig } from "../helpers.js"

afterEach(() => vi.restoreAllMocks())

describe("get-key tool", () => {
  it("builds URL with projects/proj-1/keys/key-1", async () => {
    const fetchMock = mockFetchResponse(200, { data: { id: "key-1", name: "greeting" } })
    vi.stubGlobal("fetch", fetchMock)

    await KeysAPI.getKey(testConfig, "proj-1", "key-1")

    const [url] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit]
    expect(url).toBe("https://api.test.com/api/v1/projects/proj-1/keys/key-1")
  })

  it("returns formatted success response with key data", async () => {
    const mockData = { data: { id: "key-1", name: "greeting", description: "A greeting key" } }
    const fetchMock = mockFetchResponse(200, mockData)
    vi.stubGlobal("fetch", fetchMock)

    const response = await KeysAPI.getKey(testConfig, "proj-1", "key-1")
    const data = await handleApiResponse(response, "getting key")
    const result = formatSuccessResponse(data)

    expect(result.content[0]!.type).toBe("text")
    expect(result.content[0]!.text).toBe(JSON.stringify(mockData, null, 2))
    expect(result.isError).toBeUndefined()
  })
})
