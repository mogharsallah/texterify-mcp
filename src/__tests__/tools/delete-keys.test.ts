import { describe, it, expect, vi, afterEach } from "vitest"
import { KeysAPI } from "../../api/keys-api.js"
import { handleApiResponse, formatSuccessResponse } from "../../api/api-utils.js"
import { mockFetchResponse, testConfig } from "../helpers.js"

afterEach(() => vi.restoreAllMocks())

describe("delete-keys tool", () => {
  it("sends DELETE with keys array in body", async () => {
    const mockData = { message: "Keys deleted" }
    const fetchMock = mockFetchResponse(200, mockData)
    vi.stubGlobal("fetch", fetchMock)

    const response = await KeysAPI.deleteKeys(testConfig, "proj-1", ["key-1", "key-2"])
    const data = await handleApiResponse(response, "deleting keys")
    const result = formatSuccessResponse(data)

    const [url, init] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ]
    expect(url).toContain("projects/proj-1/keys")
    expect(init.method).toBe("DELETE")
    expect(JSON.parse(init.body as string)).toEqual({ keys: ["key-1", "key-2"] })
    expect(result.content[0]!.text).toBe(JSON.stringify(mockData, null, 2))
  })

  it("sends DELETE with a single key in array", async () => {
    const fetchMock = mockFetchResponse(200, { message: "Key deleted" })
    vi.stubGlobal("fetch", fetchMock)

    await KeysAPI.deleteKeys(testConfig, "proj-1", ["key-1"])

    const [, init] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit]
    expect(JSON.parse(init.body as string)).toEqual({ keys: ["key-1"] })
  })
})
