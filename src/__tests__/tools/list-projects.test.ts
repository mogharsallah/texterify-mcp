import { describe, it, expect, vi, afterEach } from "vitest"
import { ProjectsAPI } from "../../api/projects-api.js"
import { handleApiResponse, formatSuccessResponse } from "../../api/api-utils.js"
import { mockFetchResponse, testConfig } from "../helpers.js"

afterEach(() => vi.restoreAllMocks())

describe("list-projects tool", () => {
  it("builds URL with just 'projects' (not scoped to projectId)", async () => {
    const mockData = { data: [{ id: "proj-1", name: "My Project" }] }
    const fetchMock = mockFetchResponse(200, mockData)
    vi.stubGlobal("fetch", fetchMock)

    const response = await ProjectsAPI.getProjects(testConfig)
    const data = await handleApiResponse(response, "listing projects")
    const result = formatSuccessResponse(data)

    const [url] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit]
    expect(url).toBe("https://api.test.com/api/v1/projects")
    expect(result.content[0]!.type).toBe("text")
    expect(result.content[0]!.text).toBe(JSON.stringify(mockData, null, 2))
  })

  it("includes search query param when provided", async () => {
    const fetchMock = mockFetchResponse(200, { data: [] })
    vi.stubGlobal("fetch", fetchMock)

    await ProjectsAPI.getProjects(testConfig, { search: "my-project" })

    const [url] = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit]
    const parsed = new URL(url)
    expect(parsed.searchParams.get("search")).toBe("my-project")
  })
})
