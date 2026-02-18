import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import type { Config } from "../config.js"
import { handleApiResponse, formatSuccessResponse } from "../api/api-utils.js"
import { ProjectsAPI } from "../api/projects-api.js"
import { listProjectsInputSchema } from "../types.js"
import type { IGetProjectsResponse } from "../types.js"
import { withErrorHandling } from "./tool-utils.js"

export function registerListProjects(server: McpServer, config: Config): void {
  const operation = "listing projects"

  server.registerTool(
    "list_projects",
    {
      description:
        "List all Texterify projects accessible to the authenticated user. Use this to discover project IDs and names, or to verify the currently configured project. Note: all other tools already operate on the pre-configured project (set via TEXTERIFY_PROJECT_ID environment variable), so this tool is mainly useful for discovery and verification. The response includes: `data` (projects with name, description, word_count, character_count, organization_id) and `meta.total`.",
      inputSchema: listProjectsInputSchema,
    },
    withErrorHandling(operation, async (args) => {
      const response = await ProjectsAPI.getProjects(config, {
        search: args.search as string | undefined,
        page: args.page as number | undefined,
        perPage: args.per_page as number | undefined,
      })
      const data = await handleApiResponse<IGetProjectsResponse>(response, operation)
      return formatSuccessResponse(data)
    }),
  )
}
