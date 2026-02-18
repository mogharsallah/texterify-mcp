import { vi } from "vitest"
import type { Config } from "../config.js"

/** Standard test config used across all test files. */
export const testConfig: Config = {
  authEmail: "test@example.com",
  authSecret: "secret123",
  projectId: "proj-1",
  apiBaseUrl: "https://api.test.com/api",
  apiVersion: "v1",
}

/**
 * Creates a mock `fetch` function that returns a Response with the given
 * status, JSON body, and optional statusText.
 */
export function mockFetchResponse(status: number, body: unknown, statusText = "OK"): typeof fetch {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      statusText,
      headers: { "Content-Type": "application/json" },
    }),
  )
}
