import { describe, it, expect, vi, afterEach } from "vitest"
import {
  formatSuccessResponse,
  formatErrorResponse,
  formatBodyErrorResponse,
  hasBodyErrors,
  handleApiResponse,
} from "../api/api-utils.js"

describe("formatSuccessResponse", () => {
  afterEach(() => vi.restoreAllMocks())

  it("produces 2-space JSON indentation", () => {
    const data = { id: "k1", name: "greeting" }
    const result = formatSuccessResponse(data)
    const text = result.content[0]!.text

    expect(text).toBe(JSON.stringify(data, null, 2))
    expect(text).toContain("  ")
    expect(text).not.toContain("\t")
  })

  it("properly indents nested objects", () => {
    const data = {
      key: { id: "k1", attributes: { name: "greeting", tags: ["ui", "home"] } },
    }
    const result = formatSuccessResponse(data)
    const text = result.content[0]!.text

    expect(text).toBe(JSON.stringify(data, null, 2))
    // Verify multi-level indentation exists
    expect(text).toContain("    ")
  })
})

describe("formatErrorResponse", () => {
  afterEach(() => vi.restoreAllMocks())

  it("sets isError to true", () => {
    const result = formatErrorResponse(new Error("oops"), "testOp")
    expect(result.isError).toBe(true)
  })

  it("prefixes message with operation name", () => {
    const result = formatErrorResponse(new Error("oops"), "deleteKey")
    expect(result.content[0]!.text).toMatch(/^Error deleteKey:/)
  })
})

describe("handleApiResponse with empty body", () => {
  afterEach(() => vi.restoreAllMocks())

  it("returns null when response body is empty (204-like)", async () => {
    const response = new Response("", { status: 200, statusText: "OK" })
    const result = await handleApiResponse(response, "deleteKey")
    expect(result).toBeNull()
  })
})

describe("hasBodyErrors", () => {
  it("returns true when errors object has entries", () => {
    expect(hasBodyErrors({ errors: { name: [{ error: "TAKEN" }] } })).toBe(true)
  })

  it("returns false when errors object is empty", () => {
    expect(hasBodyErrors({ errors: {} })).toBe(false)
  })

  it("returns false when errors is undefined", () => {
    expect(hasBodyErrors({ data: { id: "k1" } })).toBe(false)
  })

  it("returns false when errors is null", () => {
    expect(hasBodyErrors({ errors: null })).toBe(false)
  })

  it("returns false for null data", () => {
    expect(hasBodyErrors(null)).toBe(false)
  })

  it("returns false for non-object data", () => {
    expect(hasBodyErrors("string")).toBe(false)
  })
})

describe("formatBodyErrorResponse", () => {
  it("formats a single field error with isError true", () => {
    const data = { errors: { name: [{ error: "TAKEN" }] }, data: null }
    const result = formatBodyErrorResponse(data, "creating key")

    expect(result.isError).toBe(true)
    expect(result.content[0]!.text).toBe("Error creating key: name: TAKEN")
  })

  it("formats multiple field errors joined by commas", () => {
    const data = {
      errors: {
        name: [{ error: "BLANK" }],
        description: [{ error: "INVALID" }],
      },
      data: null,
    }
    const result = formatBodyErrorResponse(data, "creating key")

    expect(result.isError).toBe(true)
    expect(result.content[0]!.text).toBe("Error creating key: name: BLANK, description: INVALID")
  })

  it("formats multiple errors on the same field", () => {
    const data = {
      errors: { name: [{ error: "BLANK" }, { error: "INVALID" }] },
      data: null,
    }
    const result = formatBodyErrorResponse(data, "creating key")

    expect(result.isError).toBe(true)
    expect(result.content[0]!.text).toBe("Error creating key: name: BLANK, name: INVALID")
  })
})
