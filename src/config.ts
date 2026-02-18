import { z } from "zod"

const configSchema = z.object({
  authEmail: z.string().min(1, "TEXTERIFY_AUTH_EMAIL is required"),
  authSecret: z.string().min(1, "TEXTERIFY_AUTH_SECRET is required"),
  projectId: z.string().optional(),
  apiBaseUrl: z.string().default("https://app.texterify.com/api"),
  apiVersion: z.string().default("v1"),
})

export type Config = z.infer<typeof configSchema>

export function loadConfig(): Config {
  const missing: string[] = []

  if (!process.env.TEXTERIFY_AUTH_EMAIL) missing.push("TEXTERIFY_AUTH_EMAIL")
  if (!process.env.TEXTERIFY_AUTH_SECRET) missing.push("TEXTERIFY_AUTH_SECRET")

  if (missing.length > 0) {
    console.error(`Error: Missing required environment variables: ${missing.join(", ")}`)
    process.exit(1)
  }

  const config = configSchema.parse({
    authEmail: process.env.TEXTERIFY_AUTH_EMAIL,
    authSecret: process.env.TEXTERIFY_AUTH_SECRET,
    projectId: process.env.TEXTERIFY_PROJECT_ID || undefined,
    apiBaseUrl: process.env.TEXTERIFY_API_BASE_URL || undefined,
    apiVersion: process.env.TEXTERIFY_API_VERSION || undefined,
  })

  return Object.freeze(config)
}
