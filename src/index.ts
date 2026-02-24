#!/usr/bin/env node
import { createRequire } from "node:module"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"

import { loadConfig } from "./config.js"
import { registerListKeys } from "./tools/list-keys.js"
import { registerGetKey } from "./tools/get-key.js"
import { registerCreateKey } from "./tools/create-key.js"
import { registerUpdateKey } from "./tools/update-key.js"
import { registerDeleteKeys } from "./tools/delete-keys.js"
import { registerSetTranslation } from "./tools/set-translation.js"
import { registerCreateKeyWithTranslations } from "./tools/create-key-with-translations.js"
import { registerListLanguages } from "./tools/list-languages.js"
import { registerListProjects } from "./tools/list-projects.js"

async function main(): Promise<void> {
  const config = loadConfig()
  const require = createRequire(import.meta.url)
  const { version } = require("../package.json") as { version: string }

  const server = new McpServer({
    name: "texterify-mcp",
    websiteUrl: "https://texterify.com",
    title: "Texterify MCP",
    description:
      "Manage Texterify translation projects — list, create, update, and delete translation keys and their translations across languages.",
    version,
  })

  registerListKeys(server, config)
  registerGetKey(server, config)
  registerCreateKey(server, config)
  registerUpdateKey(server, config)
  registerDeleteKeys(server, config)
  registerSetTranslation(server, config)
  registerCreateKeyWithTranslations(server, config)
  registerListLanguages(server, config)
  registerListProjects(server, config)

  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("texterify-mcp server running on stdio")
}

main().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})
