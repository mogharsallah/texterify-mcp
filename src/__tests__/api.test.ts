import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import { API } from "../api/api.js"
import { testConfig } from "./helpers.js"

describe("API", () => {
  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchSpy = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }))
    vi.stubGlobal("fetch", fetchSpy)
  })

  afterEach(() => vi.restoreAllMocks())

  describe("URL construction", () => {
    it("builds URL as {apiBaseUrl}/{apiVersion}/{path}", async () => {
      await API.getRequest(testConfig, "projects/proj-1/keys")

      const [url] = fetchSpy.mock.calls[0] as [string, RequestInit]
      expect(url).toBe("https://api.test.com/api/v1/projects/proj-1/keys")
    })

    it("appends query params correctly", async () => {
      await API.getRequest(testConfig, "keys", { page: 2, search: "hello" })

      const [url] = fetchSpy.mock.calls[0] as [string, RequestInit]
      const parsed = new URL(url)
      expect(parsed.searchParams.get("page")).toBe("2")
      expect(parsed.searchParams.get("search")).toBe("hello")
    })

    it("omits undefined query param values", async () => {
      await API.getRequest(testConfig, "keys", { page: 1, search: undefined })

      const [url] = fetchSpy.mock.calls[0] as [string, RequestInit]
      const parsed = new URL(url)
      expect(parsed.searchParams.has("page")).toBe(true)
      expect(parsed.searchParams.has("search")).toBe(false)
    })
  })

  describe("headers", () => {
    it("includes Auth-Email and Auth-Secret on every request", async () => {
      await API.getRequest(testConfig, "keys")

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
      const headers = init.headers as Record<string, string>
      expect(headers["Auth-Email"]).toBe("test@example.com")
      expect(headers["Auth-Secret"]).toBe("secret123")
    })

    it("includes Content-Type and Accept as application/json", async () => {
      await API.getRequest(testConfig, "keys")

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
      const headers = init.headers as Record<string, string>
      expect(headers["Content-Type"]).toBe("application/json")
      expect(headers["Accept"]).toBe("application/json")
    })
  })

  describe("GET requests", () => {
    it("sends no body", async () => {
      await API.getRequest(testConfig, "keys")

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
      expect(init.method).toBe("GET")
      expect(init.body).toBeUndefined()
    })
  })

  describe("POST requests", () => {
    it("includes JSON body", async () => {
      const body = { name: "new-key", description: "A key" }
      await API.postRequest(testConfig, "keys", body)

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
      expect(init.method).toBe("POST")
      expect(JSON.parse(init.body as string)).toEqual(body)
    })
  })

  describe("PUT requests", () => {
    it("includes JSON body", async () => {
      const body = { name: "updated-key" }
      await API.putRequest(testConfig, "keys", body)

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
      expect(init.method).toBe("PUT")
      expect(JSON.parse(init.body as string)).toEqual(body)
    })
  })

  describe("DELETE requests", () => {
    it("includes JSON body when provided", async () => {
      const body = { ids: ["k1", "k2"] }
      await API.deleteRequest(testConfig, "keys", body)

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
      expect(init.method).toBe("DELETE")
      expect(JSON.parse(init.body as string)).toEqual(body)
    })
  })
})
