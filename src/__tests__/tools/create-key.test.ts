import { describe, it, expect, vi, afterEach } from "vitest"
import { KeysAPI } from "../../api/keys-api.js"
import {
  handleApiResponse,
  formatSuccessResponse,
  hasBodyErrors,
  formatBodyErrorResponse,
} from "../../api/api-utils.js"
import { mockFetchResponse, testConfig } from "../helpers.js"

afterEach(() => vi.restoreAllMocks())

describe("create-key tool", () => {
  it("sends POST with name in body", async () => {
    const mockData = { data: { id: "key-new", name: "test_key" } }
    const fetchMock = mockFetchResponse(200, mockData)
    vi.stubGlobal("fetch", fetchMock)

    const response = await KeysAPI.createKey(testConfig, "proj-1", { name: "test_key" })
    const data = await handleApiResponse(response, "creating key")
    const result = formatSuccessResponse(data)

    const [url, init] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ]
    expect(url).toContain("projects/proj-1/keys")
    expect(init.method).toBe("POST")
    expect(JSON.parse(init.body as string)).toEqual({ name: "test_key" })
    expect(result.content[0]!.text).toBe(JSON.stringify(mockData, null, 2))
  })

  it("includes optional fields (description, html_enabled) in body", async () => {
    const fetchMock = mockFetchResponse(200, { data: { id: "key-new" } })
    vi.stubGlobal("fetch", fetchMock)

    await KeysAPI.createKey(testConfig, "proj-1", {
      name: "test_key",
      description: "A test key",
      html_enabled: true,
    })

    const [, init] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(init.body as string)
    expect(body.name).toBe("test_key")
    expect(body.description).toBe("A test key")
    expect(body.html_enabled).toBe(true)
  })

  it("detects body-level errors and returns isError response", async () => {
    const errorBody = {
      errors: { name: [{ error: "TAKEN" }] },
      data: null,
      included: [],
    }
    const fetchMock = mockFetchResponse(200, errorBody)
    vi.stubGlobal("fetch", fetchMock)

    const response = await KeysAPI.createKey(testConfig, "proj-1", { name: "duplicate_key" })
    const data = await handleApiResponse(response, "creating key")

    expect(hasBodyErrors(data)).toBe(true)
    const result = formatBodyErrorResponse(data, "creating key")
    expect(result.isError).toBe(true)
    expect(result.content[0]!.text).toBe("Error creating key: name: TAKEN")
  })

  it("treats response without errors as success", async () => {
    const successBody = {
      data: { id: "key-new", type: "key", attributes: { name: "fresh_key" } },
      included: [],
    }
    const fetchMock = mockFetchResponse(200, successBody)
    vi.stubGlobal("fetch", fetchMock)

    const response = await KeysAPI.createKey(testConfig, "proj-1", { name: "fresh_key" })
    const data = await handleApiResponse(response, "creating key")

    expect(hasBodyErrors(data)).toBe(false)
    const result = formatSuccessResponse(data)
    expect(result.isError).toBeUndefined()
    expect(result.content[0]!.text).toBe(JSON.stringify(successBody, null, 2))
  })
})
