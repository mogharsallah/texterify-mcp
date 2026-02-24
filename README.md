# texterify-mcp

[![npm version](https://img.shields.io/npm/v/texterify-mcp.svg)](https://www.npmjs.org/package/texterify-mcp)
[![License: ISC](https://img.shields.io/badge/license-ISC-blue.svg)](https://github.com/mogharsallah/texterify-mcp/blob/main/LICENSE)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that gives LLM agents full access to the [Texterify](https://texterify.com) translation management API. Search, create, update, and delete translation keys and their translations without leaving your editor.

## Why

Managing translations during development means constant context-switching between your code editor and the Texterify web UI. This MCP server eliminates that friction -- your AI coding assistant can look up keys, add translations, find untranslated strings, and manage languages directly through natural language.

## Quick Start

The fastest way to get started is via `npx`:

```sh
npx texterify-mcp
```

Or install globally:

```sh
npm install -g texterify-mcp
```

The server requires the following environment variables:

| Variable                 | Required | Description                                                             |
| ------------------------ | -------- | ----------------------------------------------------------------------- |
| `TEXTERIFY_AUTH_EMAIL`   | Yes      | Your Texterify account email                                            |
| `TEXTERIFY_AUTH_SECRET`  | Yes      | Your Texterify API secret / access token                                |
| `TEXTERIFY_PROJECT_ID`   | No       | UUID of the project to operate on (can be provided per-tool or via env) |
| `TEXTERIFY_API_BASE_URL` | No       | API base URL (default: `https://app.texterify.com/api`)                 |
| `TEXTERIFY_API_VERSION`  | No       | API version (default: `v1`)                                             |

You can find your API credentials in your Texterify account settings.

**Note on `TEXTERIFY_PROJECT_ID`:** While this can be set as an environment variable for convenience, every project-scoped tool also accepts an optional `project_id` parameter. The resolution order is: tool parameter → environment variable → error. You can find your project ID in your project's `texterify.json` file or by using the `list_projects` tool.

## Client Configuration

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "texterify": {
      "command": "npx",
      "args": ["-y", "texterify-mcp"],
      "env": {
        "TEXTERIFY_AUTH_EMAIL": "you@example.com",
        "TEXTERIFY_AUTH_SECRET": "your-api-secret",
        "TEXTERIFY_PROJECT_ID": "your-project-uuid"
      }
    }
  }
}
```

Config file locations:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%AppData%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

### Claude Code

```sh
claude mcp add --transport stdio \
  --env TEXTERIFY_AUTH_EMAIL=you@example.com \
  --env TEXTERIFY_AUTH_SECRET=your-api-secret \
  --env TEXTERIFY_PROJECT_ID=your-project-uuid \
  texterify -- npx -y texterify-mcp
```

> **Note:** All flags (`--transport`, `--env`) must come **before** the server name. The `--` separates the server name from the command. `TEXTERIFY_PROJECT_ID` is optional and can be provided per-tool.

### OpenCode

Add to your `opencode.json` (or `opencode.jsonc`):

```json
{
  "mcp": {
    "texterify": {
      "type": "local",
      "command": ["npx", "-y", "texterify-mcp"],
      "environment": {
        "TEXTERIFY_AUTH_EMAIL": "you@example.com",
        "TEXTERIFY_AUTH_SECRET": "your-api-secret",
        "TEXTERIFY_PROJECT_ID": "your-project-uuid"
      }
    }
  }
}
```

> `TEXTERIFY_PROJECT_ID` is optional and can be provided per-tool.

### VS Code / Copilot

Add to `.vscode/mcp.json` in your workspace (or add to your user profile via **MCP: Add Server** in the Command Palette):

```json
{
  "servers": {
    "texterify": {
      "command": "npx",
      "args": ["-y", "texterify-mcp"],
      "env": {
        "TEXTERIFY_AUTH_EMAIL": "you@example.com",
        "TEXTERIFY_AUTH_SECRET": "your-api-secret",
        "TEXTERIFY_PROJECT_ID": "your-project-uuid"
      }
    }
  }
}
```

> `TEXTERIFY_PROJECT_ID` is optional and can be provided per-tool.

### Cursor

Add to `.cursor/mcp.json` in your project root (project-specific) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "texterify": {
      "command": "npx",
      "args": ["-y", "texterify-mcp"],
      "env": {
        "TEXTERIFY_AUTH_EMAIL": "you@example.com",
        "TEXTERIFY_AUTH_SECRET": "your-api-secret",
        "TEXTERIFY_PROJECT_ID": "your-project-uuid"
      }
    }
  }
}
```

> `TEXTERIFY_PROJECT_ID` is optional and can be provided per-tool.

## Available Tools

### `list_keys`

Search and list translation keys with pagination. Supports filtering by name and untranslated status.

| Parameter           | Type    | Required | Description                                                                 |
| ------------------- | ------- | -------- | --------------------------------------------------------------------------- |
| `project_id`        | string  | No       | The Texterify project UUID. If omitted, uses `TEXTERIFY_PROJECT_ID` env var |
| `search`            | string  | No       | Filter keys by name                                                         |
| `only_untranslated` | boolean | No       | Return only untranslated keys                                               |
| `page`              | number  | No       | Page number (default: 1)                                                    |
| `per_page`          | number  | No       | Results per page (default: 10, max: 50)                                     |

### `get_key`

Retrieve a single translation key with all its translations.

| Parameter    | Type   | Required | Description                                                                 |
| ------------ | ------ | -------- | --------------------------------------------------------------------------- |
| `project_id` | string | No       | The Texterify project UUID. If omitted, uses `TEXTERIFY_PROJECT_ID` env var |
| `key_id`     | string | Yes      | UUID of the key                                                             |

### `create_key`

Create a new translation key.

| Parameter               | Type    | Required | Description                                                                 |
| ----------------------- | ------- | -------- | --------------------------------------------------------------------------- |
| `project_id`            | string  | No       | The Texterify project UUID. If omitted, uses `TEXTERIFY_PROJECT_ID` env var |
| `name`                  | string  | Yes      | Key name (e.g. `welcome_message`)                                           |
| `description`           | string  | No       | Human-readable description                                                  |
| `html_enabled`          | boolean | No       | Allow HTML in value                                                         |
| `pluralization_enabled` | boolean | No       | Enable pluralization                                                        |

### `update_key`

Update an existing key's properties. Only provided fields are changed.

| Parameter               | Type    | Required | Description                                                                 |
| ----------------------- | ------- | -------- | --------------------------------------------------------------------------- |
| `project_id`            | string  | No       | The Texterify project UUID. If omitted, uses `TEXTERIFY_PROJECT_ID` env var |
| `key_id`                | string  | Yes      | UUID of the key                                                             |
| `name`                  | string  | No       | New key name                                                                |
| `description`           | string  | No       | New description                                                             |
| `html_enabled`          | boolean | No       | Toggle HTML support                                                         |
| `pluralization_enabled` | boolean | No       | Toggle pluralization                                                        |

### `delete_keys`

Delete one or more translation keys.

| Parameter    | Type     | Required | Description                                                                 |
| ------------ | -------- | -------- | --------------------------------------------------------------------------- |
| `project_id` | string   | No       | The Texterify project UUID. If omitted, uses `TEXTERIFY_PROJECT_ID` env var |
| `key_ids`    | string[] | Yes      | Array of key UUIDs to delete                                                |

### `set_translation`

Create or update a translation for a specific key and language (upsert).

| Parameter     | Type   | Required | Description                                                                 |
| ------------- | ------ | -------- | --------------------------------------------------------------------------- |
| `project_id`  | string | No       | The Texterify project UUID. If omitted, uses `TEXTERIFY_PROJECT_ID` env var |
| `key_id`      | string | Yes      | UUID of the key                                                             |
| `language_id` | string | Yes      | UUID of the language                                                        |
| `content`     | string | Yes      | Translation text                                                            |
| `zero`        | string | No       | Plural form: zero                                                           |
| `one`         | string | No       | Plural form: one                                                            |
| `two`         | string | No       | Plural form: two                                                            |
| `few`         | string | No       | Plural form: few                                                            |
| `many`        | string | No       | Plural form: many                                                           |

### `list_languages`

List languages configured in the project with translation progress.

| Parameter    | Type   | Required | Description                                                                 |
| ------------ | ------ | -------- | --------------------------------------------------------------------------- |
| `project_id` | string | No       | The Texterify project UUID. If omitted, uses `TEXTERIFY_PROJECT_ID` env var |
| `search`     | string | No       | Filter by language name                                                     |
| `page`       | number | No       | Page number (default: 1)                                                    |
| `per_page`   | number | No       | Results per page (default: 10, max: 50)                                     |

### `list_projects`

List all Texterify projects accessible to the authenticated user. Useful for finding project IDs.

| Parameter  | Type   | Required | Description                             |
| ---------- | ------ | -------- | --------------------------------------- |
| `search`   | string | No       | Filter by project name                  |
| `page`     | number | No       | Page number (default: 1)                |
| `per_page` | number | No       | Results per page (default: 10, max: 50) |

## Example Prompts

Once configured, you can ask your AI assistant things like:

- "List all untranslated keys in my project"
- "Create a key called `checkout.success_message` with description 'Shown after payment'"
- "What languages are configured in this project?"
- "Set the German translation for key X to 'Willkommen'"
- "Find all keys matching 'error'"
- "Delete the keys I just created"

## Development

Requires Node.js 18+ and pnpm.

```sh
# Install dependencies
pnpm install

# Run the server
pnpm start

# Run in watch mode
pnpm dev

# Type-check
pnpm exec tsc --noEmit

# Run tests
pnpm test
```

## How It Works

The server uses **stdio transport** -- it communicates over stdin/stdout using the MCP JSON-RPC protocol. All logging goes to stderr to keep the protocol channel clean.

```
MCP Client (LLM Agent)
    |  stdio (JSON-RPC)
    v
Tool Handlers (Zod-validated inputs)
    |
    v
API Client (native fetch)
    |
    v
Texterify REST API
```

- **No build step** -- TypeScript is executed directly via `tsx`
- **Native `fetch`** -- zero HTTP library dependencies (Node.js 18+)
- **Zod v4** schemas for input validation and automatic JSON Schema generation
- Structured error handling with clear messages for auth failures, missing resources, and validation errors

## License

ISC
