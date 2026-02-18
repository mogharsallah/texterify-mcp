# TypeScript Conventions

## Compiler Settings (tsconfig.json)

- `"strict": true` -- all strict checks enabled; never use `any` without justification
- `"target": "ES2022"`, `"module": "ES2022"` -- modern JS features (top-level await OK)
- `"moduleResolution": "bundler"` -- `.js` extensions in relative imports are optional
- `"esModuleInterop": true` -- default imports from CommonJS modules are fine

## Imports

- ESM `import`/`export` exclusively. Never use `require()`.
- Order: (1) node built-ins, (2) external packages, (3) local modules.
- Separate groups with a blank line.
- Prefer named exports over default exports.

```typescript
import { readFile } from "node:fs/promises"

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { API } from "./api/api.js"
import type { Config } from "./config.js"
```

## Naming Conventions

- **Files:** kebab-case (`list-keys.ts`, `api-client.ts`)
- **Types/Interfaces:** PascalCase (`TranslationKey`, `ApiResponse`)
- **Functions/variables:** camelCase (`listKeys`, `apiBaseUrl`)
- **Constants:** camelCase or UPPER_SNAKE_CASE for true compile-time constants
- **Zod schemas:** camelCase suffixed with `Schema` (`listKeysInputSchema`)

## Types

- Use `interface` for object shapes that may be extended; `type` for unions, intersections, and computed types.
- Define Zod v4 schemas for all MCP tool inputs; infer TypeScript types with `z.infer<typeof schema>`.
- Prefer `unknown` over `any`. If `any` is needed, add a `// eslint-disable` comment explaining why.
- Use `readonly` for data that should not be mutated after creation.

## Strings

- Use double quotes (matches JSON and default TS formatter behavior).
