---
name: mcp
description: >
  Model Context Protocol (MCP) development guide for building servers and clients
  in TypeScript. Use when: (1) Building an MCP server that exposes tools, resources,
  or prompts, (2) Building an MCP client that connects to servers, (3) Implementing
  MCP transports (stdio, HTTP/SSE), (4) Understanding MCP architecture, lifecycle,
  or authorization, (5) Publishing MCP servers to the registry, (6) Debugging MCP
  with the Inspector tool, (7) Any task involving @modelcontextprotocol/sdk.
---

# Model Context Protocol (MCP)

MCP is an open protocol that standardizes how AI applications connect to external
tools, data sources, and workflows. Think of it as USB-C for AI apps.

**Architecture:** Host (AI app) -> Client (protocol handler) -> Server (exposes capabilities)

Servers expose three primitives:

- **Tools** -- Functions the LLM can invoke (with user approval)
- **Resources** -- File-like read-only data (API responses, file contents)
- **Prompts** -- Pre-written templates for specific tasks

For architecture details, fetch: https://modelcontextprotocol.io/docs/learn/architecture.md

## Building an MCP Server (TypeScript)

Install dependencies:

```bash
npm install @modelcontextprotocol/sdk zod
npm install -D @types/node typescript
```

Minimal server with a tool:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"

const server = new McpServer({
  name: "my-server",
  version: "1.0.0",
})

server.registerTool(
  "my_tool",
  {
    description: "Describe what this tool does",
    inputSchema: {
      param: z.string().describe("Parameter description"),
    },
  },
  async ({ param }) => {
    // Tool logic here
    return {
      content: [{ type: "text", text: `Result: ${param}` }],
    }
  },
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("Server running on stdio")
}

main().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})
```

### Key Server Patterns

**STDIO transport** -- Never write to stdout (use `console.error()`). Stdout is
reserved for JSON-RPC messages.

**HTTP/SSE transport** -- Standard output logging is fine. Use for remote servers.

**Error handling in tools** -- Return error content, do not throw:

```typescript
server.registerTool("example", { description: "...", inputSchema: {} }, async () => {
  try {
    const result = await doWork()
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
      isError: true,
    }
  }
})
```

**Resources** -- Expose read-only data:

```typescript
server.resource("config", "config://app", async (uri) => ({
  contents: [{ uri: uri.href, mimeType: "application/json", text: "{}" }],
}))
```

**Prompts** -- Provide reusable templates:

```typescript
server.prompt("summarize", { text: z.string() }, ({ text }) => ({
  messages: [{ role: "user", content: { type: "text", text: `Summarize: ${text}` } }],
}))
```

For the full server building tutorial, fetch:
https://modelcontextprotocol.io/docs/develop/build-server.md

For server concepts, fetch:
https://modelcontextprotocol.io/docs/learn/server-concepts.md

## Building an MCP Client (TypeScript)

Minimal client connecting to a server over stdio:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"

const transport = new StdioClientTransport({
  command: "node",
  args: ["path/to/server.js"],
})

const client = new Client({ name: "my-client", version: "1.0.0" })
await client.connect(transport)

// List available tools
const tools = await client.listTools()

// Call a tool
const result = await client.callTool({ name: "my_tool", arguments: { param: "value" } })

// List resources
const resources = await client.listResources()

// Read a resource
const data = await client.readResource({ uri: "config://app" })

// Disconnect
await client.close()
```

For the full client building tutorial, fetch:
https://modelcontextprotocol.io/docs/develop/build-client.md

For client concepts, fetch:
https://modelcontextprotocol.io/docs/learn/client-concepts.md

## Transports

- **stdio** -- Local servers, launched as child processes. Most common for dev tools.
- **Streamable HTTP** -- Remote servers, supports SSE for server-to-client streaming.

For transport details, fetch:
https://modelcontextprotocol.io/specification/2025-11-25/basic/transports.md

## Testing & Debugging

Use the **MCP Inspector** to test servers interactively:

```bash
npx @modelcontextprotocol/inspector node path/to/server.js
```

For Inspector guide, fetch:
https://modelcontextprotocol.io/docs/tools/inspector.md

## Connecting to Servers

- **Local servers (Claude Desktop, etc.):** https://modelcontextprotocol.io/docs/develop/connect-local-servers.md
- **Remote servers:** https://modelcontextprotocol.io/docs/develop/connect-remote-servers.md

## Reference Documentation

Fetch these URLs when deeper context is needed on a specific topic.

### Getting Started

| Topic           | URL                                                           |
| --------------- | ------------------------------------------------------------- |
| What is MCP?    | https://modelcontextprotocol.io/docs/getting-started/intro.md |
| Architecture    | https://modelcontextprotocol.io/docs/learn/architecture.md    |
| Server Concepts | https://modelcontextprotocol.io/docs/learn/server-concepts.md |
| Client Concepts | https://modelcontextprotocol.io/docs/learn/client-concepts.md |
| Build a Server  | https://modelcontextprotocol.io/docs/develop/build-server.md  |
| Build a Client  | https://modelcontextprotocol.io/docs/develop/build-client.md  |
| SDKs Overview   | https://modelcontextprotocol.io/docs/sdk.md                   |
| Example Servers | https://modelcontextprotocol.io/examples.md                   |
| Example Clients | https://modelcontextprotocol.io/clients.md                    |

### Extensions

| Topic                      | URL                                                         |
| -------------------------- | ----------------------------------------------------------- |
| Extensions Overview        | https://modelcontextprotocol.io/docs/extensions/overview.md |
| MCP Apps (interactive UIs) | https://modelcontextprotocol.io/docs/extensions/apps.md     |

### Specification (2025-11-25)

Core protocol spec. Fetch the index first, then drill into specific sections.

| Topic               | URL                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------- |
| Specification Index | https://modelcontextprotocol.io/specification/2025-11-25/index.md                        |
| Architecture        | https://modelcontextprotocol.io/specification/2025-11-25/architecture/index.md           |
| Changelog           | https://modelcontextprotocol.io/specification/2025-11-25/changelog.md                    |
| Schema Reference    | https://modelcontextprotocol.io/specification/2025-11-25/schema.md                       |
| Versioning          | https://modelcontextprotocol.io/specification/versioning.md                              |
| **Base Protocol**   |                                                                                          |
| Overview            | https://modelcontextprotocol.io/specification/2025-11-25/basic/index.md                  |
| Lifecycle           | https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle.md              |
| Transports          | https://modelcontextprotocol.io/specification/2025-11-25/basic/transports.md             |
| Authorization       | https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization.md          |
| **Utilities**       |                                                                                          |
| Cancellation        | https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/cancellation.md |
| Ping                | https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/ping.md         |
| Progress            | https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/progress.md     |
| Tasks               | https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/tasks.md        |
| **Client Features** |                                                                                          |
| Elicitation         | https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation.md           |
| Roots               | https://modelcontextprotocol.io/specification/2025-11-25/client/roots.md                 |
| Sampling            | https://modelcontextprotocol.io/specification/2025-11-25/client/sampling.md              |
| **Server Features** |                                                                                          |
| Server Overview     | https://modelcontextprotocol.io/specification/2025-11-25/server/index.md                 |
| Prompts             | https://modelcontextprotocol.io/specification/2025-11-25/server/prompts.md               |
| Resources           | https://modelcontextprotocol.io/specification/2025-11-25/server/resources.md             |
| Tools               | https://modelcontextprotocol.io/specification/2025-11-25/server/tools.md                 |
| Completion          | https://modelcontextprotocol.io/specification/2025-11-25/server/utilities/completion.md  |
| Logging             | https://modelcontextprotocol.io/specification/2025-11-25/server/utilities/logging.md     |
| Pagination          | https://modelcontextprotocol.io/specification/2025-11-25/server/utilities/pagination.md  |

### Security & Authorization

| Topic                   | URL                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------- |
| Authorization Tutorial  | https://modelcontextprotocol.io/docs/tutorials/security/authorization.md           |
| Security Best Practices | https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices.md |

### MCP Registry

Publishing and managing MCP servers in the official registry.

| Topic                | URL                                                              |
| -------------------- | ---------------------------------------------------------------- |
| About the Registry   | https://modelcontextprotocol.io/registry/about.md                |
| Quickstart (publish) | https://modelcontextprotocol.io/registry/quickstart.md           |
| Authentication       | https://modelcontextprotocol.io/registry/authentication.md       |
| GitHub Actions       | https://modelcontextprotocol.io/registry/github-actions.md       |
| Package Types        | https://modelcontextprotocol.io/registry/package-types.md        |
| Remote Servers       | https://modelcontextprotocol.io/registry/remote-servers.md       |
| Versioning           | https://modelcontextprotocol.io/registry/versioning.md           |
| Registry Aggregators | https://modelcontextprotocol.io/registry/registry-aggregators.md |
| Moderation Policy    | https://modelcontextprotocol.io/registry/moderation-policy.md    |
| FAQ                  | https://modelcontextprotocol.io/registry/faq.md                  |
| Terms of Service     | https://modelcontextprotocol.io/registry/terms-of-service.md     |

### Community & Governance

| Topic                     | URL                                                                  |
| ------------------------- | -------------------------------------------------------------------- |
| Contributing              | https://modelcontextprotocol.io/community/contributing.md            |
| Governance                | https://modelcontextprotocol.io/community/governance.md              |
| Communication             | https://modelcontextprotocol.io/community/communication.md           |
| SDK Tiering System        | https://modelcontextprotocol.io/community/sdk-tiers.md               |
| Working & Interest Groups | https://modelcontextprotocol.io/community/working-interest-groups.md |
| SEP Guidelines            | https://modelcontextprotocol.io/community/sep-guidelines.md          |
| Antitrust Policy          | https://modelcontextprotocol.io/community/antitrust.md               |
| Roadmap                   | https://modelcontextprotocol.io/development/roadmap.md               |

### Specification Enhancement Proposals (SEPs)

Proposals for protocol changes. Fetch the index for a full listing, or individual
SEPs when working on a specific feature area.

| Topic                                   | URL                                                                                                       |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| SEP Index                               | https://modelcontextprotocol.io/community/seps/index.md                                                   |
| SEP-932: Governance                     | https://modelcontextprotocol.io/community/seps/932-model-context-protocol-governance.md                   |
| SEP-973: Metadata for implementations   | https://modelcontextprotocol.io/community/seps/973-expose-additional-metadata-for-implementations-res.md  |
| SEP-985: OAuth 2.0 / RFC 9728           | https://modelcontextprotocol.io/community/seps/985-align-oauth-20-protected-resource-metadata-with-rf.md  |
| SEP-986: Tool name format               | https://modelcontextprotocol.io/community/seps/986-specify-format-for-tool-names.md                       |
| SEP-990: Enterprise IdP controls        | https://modelcontextprotocol.io/community/seps/990-enable-enterprise-idp-policy-controls-during-mcp-o.md  |
| SEP-991: URL-based client registration  | https://modelcontextprotocol.io/community/seps/991-enable-url-based-client-registration-using-oauth-c.md  |
| SEP-994: Communication practices        | https://modelcontextprotocol.io/community/seps/994-shared-communication-practicesguidelines.md            |
| SEP-1024: Client security (local)       | https://modelcontextprotocol.io/community/seps/1024-mcp-client-security-requirements-for-local-server-.md |
| SEP-1034: Default values in elicitation | https://modelcontextprotocol.io/community/seps/1034--support-default-values-for-all-primitive-types-in.md |
| SEP-1036: URL mode elicitation          | https://modelcontextprotocol.io/community/seps/1036-url-mode-elicitation-for-secure-out-of-band-intera.md |
| SEP-1046: OAuth client credentials      | https://modelcontextprotocol.io/community/seps/1046-support-oauth-client-credentials-flow-in-authoriza.md |
| SEP-1302: Working groups governance     | https://modelcontextprotocol.io/community/seps/1302-formalize-working-groups-and-interest-groups-in-mc.md |
| SEP-1303: Input validation errors       | https://modelcontextprotocol.io/community/seps/1303-input-validation-errors-as-tool-execution-errors.md   |
| SEP-1319: Decouple request payload      | https://modelcontextprotocol.io/community/seps/1319-decouple-request-payload-from-rpc-methods-definiti.md |
| SEP-1330: Elicitation enum schema       | https://modelcontextprotocol.io/community/seps/1330-elicitation-enum-schema-improvements-and-standards.md |
| SEP-1577: Sampling with tools           | https://modelcontextprotocol.io/community/seps/1577--sampling-with-tools.md                               |
| SEP-1613: JSON Schema 2020-12           | https://modelcontextprotocol.io/community/seps/1613-establish-json-schema-2020-12-as-default-dialect-f.md |
| SEP-1686: Tasks                         | https://modelcontextprotocol.io/community/seps/1686-tasks.md                                              |
| SEP-1699: SSE polling disconnect        | https://modelcontextprotocol.io/community/seps/1699-support-sse-polling-via-server-side-disconnect.md     |
| SEP-1730: SDK tiering system            | https://modelcontextprotocol.io/community/seps/1730-sdks-tiering-system.md                                |
| SEP-1850: PR-based SEP workflow         | https://modelcontextprotocol.io/community/seps/1850-pr-based-sep-workflow.md                              |
| SEP-1865: MCP Apps (interactive UIs)    | https://modelcontextprotocol.io/community/seps/1865-mcp-apps-interactive-user-interfaces-for-mcp.md       |
| SEP-2085: Governance succession         | https://modelcontextprotocol.io/community/seps/2085-governance-succession-and-amendment.md                |
| SEP-2133: Extensions                    | https://modelcontextprotocol.io/community/seps/2133-extensions.md                                         |
