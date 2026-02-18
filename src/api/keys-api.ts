import type { Config } from "../config.js"
import { API } from "./api.js"

export interface GetKeysOptions {
  search?: string
  page?: number
  perPage?: number
  onlyUntranslated?: boolean
}

export interface CreateKeyBody {
  name: string
  description?: string
  html_enabled?: boolean
  pluralization_enabled?: boolean
}

export interface UpdateKeyBody {
  name?: string
  description?: string
  html_enabled?: boolean
  pluralization_enabled?: boolean
}

export const KeysAPI = {
  getKeys(config: Config, projectId: string, options?: GetKeysOptions): Promise<Response> {
    const queryParams: Record<string, string | number | boolean | undefined> = {}
    if (options?.search) queryParams.search = options.search
    if (options?.page) queryParams.page = options.page
    if (options?.perPage) queryParams.per_page = options.perPage
    if (options?.onlyUntranslated) queryParams.only_untranslated = options.onlyUntranslated

    return API.getRequest(config, `projects/${projectId}/keys`, queryParams)
  },

  getKey(config: Config, projectId: string, keyId: string): Promise<Response> {
    return API.getRequest(config, `projects/${projectId}/keys/${keyId}`)
  },

  createKey(config: Config, projectId: string, body: CreateKeyBody): Promise<Response> {
    return API.postRequest(config, `projects/${projectId}/keys`, body)
  },

  updateKey(
    config: Config,
    projectId: string,
    keyId: string,
    body: UpdateKeyBody,
  ): Promise<Response> {
    return API.putRequest(config, `projects/${projectId}/keys/${keyId}`, body)
  },

  deleteKeys(config: Config, projectId: string, keyIds: string[]): Promise<Response> {
    return API.deleteRequest(config, `projects/${projectId}/keys`, { keys: keyIds })
  },
}
