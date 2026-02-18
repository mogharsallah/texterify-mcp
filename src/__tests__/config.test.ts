import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import { loadConfig } from "../config.js"

describe("loadConfig", () => {
  beforeEach(() => {
    vi.stubEnv("TEXTERIFY_AUTH_EMAIL", "")
    vi.stubEnv("TEXTERIFY_AUTH_SECRET", "")
    vi.stubEnv("TEXTERIFY_PROJECT_ID", "")
    vi.stubEnv("TEXTERIFY_API_BASE_URL", "")
    vi.stubEnv("TEXTERIFY_API_VERSION", "")
  })

  afterEach(() => vi.restoreAllMocks())

  describe("missing required variables", () => {
    it("exits with error listing both auth vars when all required are missing", () => {
      const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
        throw new Error("process.exit")
      })
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      expect(() => loadConfig()).toThrow("process.exit")
      expect(exitSpy).toHaveBeenCalledWith(1)
      expect(errorSpy).toHaveBeenCalledOnce()

      const msg = errorSpy.mock.calls[0]![0] as string
      expect(msg).toContain("TEXTERIFY_AUTH_EMAIL")
      expect(msg).toContain("TEXTERIFY_AUTH_SECRET")
    })

    it.each([
      ["TEXTERIFY_AUTH_EMAIL", { TEXTERIFY_AUTH_SECRET: "s" }],
      ["TEXTERIFY_AUTH_SECRET", { TEXTERIFY_AUTH_EMAIL: "e" }],
    ])("exits with error naming %s when only that var is missing", (missingVar, presentVars) => {
      for (const [key, value] of Object.entries(presentVars)) {
        vi.stubEnv(key, value)
      }

      const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
        throw new Error("process.exit")
      })
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      expect(() => loadConfig()).toThrow("process.exit")
      expect(exitSpy).toHaveBeenCalledWith(1)

      const msg = errorSpy.mock.calls[0]![0] as string
      expect(msg).toContain(missingVar)
    })

    it("starts successfully when only project_id is missing", () => {
      vi.stubEnv("TEXTERIFY_AUTH_EMAIL", "user@test.com")
      vi.stubEnv("TEXTERIFY_AUTH_SECRET", "secret-key")

      const config = loadConfig()
      expect(config.authEmail).toBe("user@test.com")
      expect(config.authSecret).toBe("secret-key")
      expect(config.projectId).toBeUndefined()
    })
  })

  describe("all required vars present", () => {
    beforeEach(() => {
      vi.stubEnv("TEXTERIFY_AUTH_EMAIL", "user@test.com")
      vi.stubEnv("TEXTERIFY_AUTH_SECRET", "secret-key")
      vi.stubEnv("TEXTERIFY_PROJECT_ID", "proj-123")
    })

    it("returns a valid config object", () => {
      const config = loadConfig()
      expect(config.authEmail).toBe("user@test.com")
      expect(config.authSecret).toBe("secret-key")
      expect(config.projectId).toBe("proj-123")
    })

    it("applies defaults when optional vars are not set", () => {
      const config = loadConfig()
      expect(config.apiBaseUrl).toBe("https://app.texterify.com/api")
      expect(config.apiVersion).toBe("v1")
    })

    it("uses custom values when optional vars are set", () => {
      vi.stubEnv("TEXTERIFY_API_BASE_URL", "https://custom.host/api")
      vi.stubEnv("TEXTERIFY_API_VERSION", "v2")

      const config = loadConfig()
      expect(config.apiBaseUrl).toBe("https://custom.host/api")
      expect(config.apiVersion).toBe("v2")
    })

    it("returns a frozen (immutable) config object", () => {
      const config = loadConfig()
      expect(Object.isFrozen(config)).toBe(true)
      expect(() => {
        ;(config as Record<string, unknown>).authEmail = "other"
      }).toThrow()
    })
  })
})
