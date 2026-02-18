import type { Config } from "../config.js"
import { API } from "./api.js"

export interface CreateTranslationBody {
  key_id: string
  language_id: string
  translation: Record<string, string>
}

export const TranslationsAPI = {
  createTranslation(
    config: Config,
    projectId: string,
    body: CreateTranslationBody,
  ): Promise<Response> {
    return API.postRequest(config, `projects/${projectId}/translations`, body)
  },
}
