import type { Config } from "../config.js"
import { API } from "./api.js"

export interface GetProjectsOptions {
  search?: string
  page?: number
  perPage?: number
}

export const ProjectsAPI = {
  getProjects(config: Config, options?: GetProjectsOptions): Promise<Response> {
    const queryParams: Record<string, string | number | boolean | undefined> = {}
    if (options?.search) queryParams.search = options.search
    if (options?.page) queryParams.page = options.page
    if (options?.perPage) queryParams.per_page = options.perPage

    return API.getRequest(config, "projects", queryParams)
  },
}
