# texterify-mcp

TypeScript MCP server exposing Texterify translation management as tools for LLM agents (stdio transport).

## Quick Reference

- **Package Manager:** pnpm (do NOT use npm or yarn)
- **Install:** `pnpm install`
- **Start:** `pnpm start`
- **Dev:** `pnpm dev`
- **Typecheck:** `pnpm exec tsc --noEmit`
- **Test:** `pnpm test`

No build step -- `tsx` runs TypeScript directly.

**Important:** When working on MCP-related topics (server setup, tool registration, transports, protocol details), load the `mcp` skill first for detailed SDK guidance and patterns.

## Detailed Instructions

- [TypeScript Conventions](.opencode/docs/typescript.md)
- [API & Error Handling Patterns](.opencode/docs/api-patterns.md)
- [Architecture & MCP](.opencode/docs/architecture.md)
- [Workflow (Git, Testing, Linting)](.opencode/docs/workflow.md)
