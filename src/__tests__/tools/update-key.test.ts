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

describe("update-key tool", () => {
  it("sends PUT to correct URL with body", async () => {
    const mockData = { data: { id: "key-1", name: "new_name" } }
    const fetchMock = mockFetchResponse(200, mockData)
    vi.stubGlobal("fetch", fetchMock)

    const response = await KeysAPI.updateKey(testConfig, "proj-1", "key-1", { name: "new_name" })
    const data = await handleApiResponse(response, "updating key")
    const result = formatSuccessResponse(data)

    const [url, init] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ]
    expect(url).toBe("https://api.test.com/api/v1/projects/proj-1/keys/key-1")
    expect(init.method).toBe("PUT")
    expect(JSON.parse(init.body as string)).toEqual({ name: "new_name" })
    expect(result.content[0]!.text).toBe(JSON.stringify(mockData, null, 2))
  })

  it("sends only provided fields in body (partial update)", async () => {
    const fetchMock = mockFetchResponse(200, { data: { id: "key-1" } })
    vi.stubGlobal("fetch", fetchMock)

    await KeysAPI.updateKey(testConfig, "proj-1", "key-1", { description: "updated desc" })

    const [, init] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(init.body as string)
    expect(body).toEqual({ description: "updated desc" })
    expect(body.name).toBeUndefined()
  })

  it("detects body-level validation errors (e.g., duplicate name)", async () => {
    const errorBody = {
      errors: { name: [{ error: "TAKEN" }] },
    }
    const fetchMock = mockFetchResponse(200, errorBody)
    vi.stubGlobal("fetch", fetchMock)

    const response = await KeysAPI.updateKey(testConfig, "proj-1", "key-1", {
      name: "duplicate_name",
    })
    const data = await handleApiResponse(response, "updating key")

    expect(hasBodyErrors(data)).toBe(true)
    const result = formatBodyErrorResponse(data, "updating key")
    expect(result.isError).toBe(true)
    expect(result.content[0]!.text).toContain("name: TAKEN")
  })
})
