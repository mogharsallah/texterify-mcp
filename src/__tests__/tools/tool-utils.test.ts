import { describe, it, expect } from "vitest"
import { buildCreateKeyBody, buildTranslationRecord } from "../../tools/tool-utils.js"

describe("buildCreateKeyBody", () => {
  it("returns only name when no optional fields are provided", () => {
    const body = buildCreateKeyBody({ name: "greeting" })

    expect(body).toEqual({ name: "greeting" })
    expect(body).not.toHaveProperty("description")
    expect(body).not.toHaveProperty("html_enabled")
    expect(body).not.toHaveProperty("pluralization_enabled")
  })

  it("includes description when provided", () => {
    const body = buildCreateKeyBody({ name: "greeting", description: "A greeting message" })

    expect(body.name).toBe("greeting")
    expect(body.description).toBe("A greeting message")
  })

  it("includes html_enabled when provided", () => {
    const body = buildCreateKeyBody({ name: "rich_text", html_enabled: true })

    expect(body.html_enabled).toBe(true)
  })

  it("includes pluralization_enabled when provided", () => {
    const body = buildCreateKeyBody({ name: "item_count", pluralization_enabled: true })

    expect(body.pluralization_enabled).toBe(true)
  })

  it("includes all optional fields when all are provided", () => {
    const body = buildCreateKeyBody({
      name: "full_key",
      description: "Full description",
      html_enabled: true,
      pluralization_enabled: false,
    })

    expect(body).toEqual({
      name: "full_key",
      description: "Full description",
      html_enabled: true,
      pluralization_enabled: false,
    })
  })
})

describe("buildTranslationRecord", () => {
  it("returns only content when no plural forms are provided", () => {
    const record = buildTranslationRecord({ content: "Hello" })

    expect(record).toEqual({ content: "Hello" })
    expect(record).not.toHaveProperty("zero")
    expect(record).not.toHaveProperty("one")
    expect(record).not.toHaveProperty("two")
    expect(record).not.toHaveProperty("few")
    expect(record).not.toHaveProperty("many")
  })

  it("includes all plural forms when all are provided", () => {
    const record = buildTranslationRecord({
      content: "items",
      zero: "no items",
      one: "one item",
      two: "two items",
      few: "a few items",
      many: "many items",
    })

    expect(record).toEqual({
      content: "items",
      zero: "no items",
      one: "one item",
      two: "two items",
      few: "a few items",
      many: "many items",
    })
  })

  it("includes only the plural forms that are provided", () => {
    const record = buildTranslationRecord({
      content: "items",
      one: "one item",
      many: "many items",
    })

    expect(record).toEqual({
      content: "items",
      one: "one item",
      many: "many items",
    })
    expect(record).not.toHaveProperty("zero")
    expect(record).not.toHaveProperty("two")
    expect(record).not.toHaveProperty("few")
  })

  it("omits plural forms that are explicitly undefined", () => {
    const record = buildTranslationRecord({
      content: "Hello",
      zero: undefined,
      one: undefined,
    })

    expect(record).toEqual({ content: "Hello" })
  })
})
