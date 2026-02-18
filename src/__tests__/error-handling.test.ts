import { describe, it, expect, vi, afterEach } from "vitest"
import { handleApiResponse, formatErrorResponse, ApiError } from "../api/api-utils.js"

describe("handleApiResponse", () => {
  afterEach(() => vi.restoreAllMocks())

  it("throws ApiError with auth failure message mentioning env var names on 403", async () => {
    const response = new Response("Forbidden body", {
      status: 403,
      statusText: "Forbidden",
      headers: { "Content-Type": "text/plain" },
    })

    await expect(handleApiResponse(response, "listKeys")).rejects.toThrow(ApiError)

    try {
      await handleApiResponse(
        new Response("Forbidden body", { status: 403, statusText: "Forbidden" }),
        "listKeys",
      )
    } catch (err) {
      const apiErr = err as ApiError
      expect(apiErr.statusCode).toBe(403)
      expect(apiErr.responseBody).toContain("TEXTERIFY_AUTH_EMAIL")
      expect(apiErr.responseBody).toContain("TEXTERIFY_AUTH_SECRET")
      expect(apiErr.responseBody).toContain("Authentication failed")
    }
  })

  it("throws ApiError with not-found message on 404", async () => {
    const response = new Response("Not found body", {
      status: 404,
      statusText: "Not Found",
    })

    await expect(handleApiResponse(response, "getKey")).rejects.toThrow(ApiError)

    try {
      await handleApiResponse(
        new Response("Not found body", { status: 404, statusText: "Not Found" }),
        "getKey",
      )
    } catch (err) {
      const apiErr = err as ApiError
      expect(apiErr.statusCode).toBe(404)
      expect(apiErr.responseBody).toContain("not found")
    }
  })

  it("throws ApiError with status code, text, and body on 500", async () => {
    const response = new Response("Internal server error details", {
      status: 500,
      statusText: "Internal Server Error",
    })

    try {
      await handleApiResponse(response, "createKey")
    } catch (err) {
      const apiErr = err as ApiError
      expect(apiErr).toBeInstanceOf(ApiError)
      expect(apiErr.statusCode).toBe(500)
      expect(apiErr.statusText).toBe("Internal Server Error")
      expect(apiErr.responseBody).toContain("500")
      expect(apiErr.responseBody).toContain("Internal Server Error")
      expect(apiErr.responseBody).toContain("Internal server error details")
    }
  })

  it("throws ApiError with validation error details on 422", async () => {
    const validationBody = JSON.stringify({ errors: { name: ["is too short"] } })
    const response = new Response(validationBody, {
      status: 422,
      statusText: "Unprocessable Entity",
    })

    try {
      await handleApiResponse(response, "updateKey")
    } catch (err) {
      const apiErr = err as ApiError
      expect(apiErr).toBeInstanceOf(ApiError)
      expect(apiErr.statusCode).toBe(422)
      expect(apiErr.responseBody).toContain("is too short")
    }
  })
})

describe("formatErrorResponse", () => {
  afterEach(() => vi.restoreAllMocks())

  it("returns descriptive message with isError for network TypeError", () => {
    const error = new TypeError("fetch failed")
    const result = formatErrorResponse(error, "listKeys")

    expect(result.isError).toBe(true)
    expect(result.content[0]!.text).toContain("Network error")
    expect(result.content[0]!.text).toContain("fetch failed")
  })

  it("returns isError with prefixed message for ApiError", () => {
    const error = new ApiError("listKeys", 500, "Internal Server Error", "server broke")
    const result = formatErrorResponse(error, "listKeys")

    expect(result.isError).toBe(true)
    expect(result.content[0]!.text).toContain("listKeys")
    expect(result.content[0]!.text).toContain("server broke")
  })

  it("returns isError with network error format for generic Error", () => {
    const error = new Error("connection refused")
    const result = formatErrorResponse(error, "createTranslation")

    expect(result.isError).toBe(true)
    expect(result.content[0]!.text).toContain("Network error")
    expect(result.content[0]!.text).toContain("connection refused")
  })
})
