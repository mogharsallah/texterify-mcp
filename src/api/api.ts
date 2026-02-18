import type { Config } from "../config.js"

interface ApiRequestOptions {
  path: string
  method: "GET" | "POST" | "PUT" | "DELETE"
  queryParams?: Record<string, string | number | boolean | undefined>
  body?: unknown
  signal?: AbortSignal
}

function buildUrl(
  config: Config,
  path: string,
  queryParams?: Record<string, string | number | boolean | undefined>,
): string {
  const base = `${config.apiBaseUrl}/${config.apiVersion}/${path}`
  if (!queryParams) return base

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(queryParams)) {
    if (value !== undefined && value !== null) {
      params.set(key, String(value))
    }
  }
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

function buildHeaders(config: Config): Record<string, string> {
  return {
    "Auth-Email": config.authEmail,
    "Auth-Secret": config.authSecret,
    "Content-Type": "application/json",
    Accept: "application/json",
  }
}

async function apiRequest(config: Config, options: ApiRequestOptions): Promise<Response> {
  const url = buildUrl(config, options.path, options.queryParams)
  const headers = buildHeaders(config)

  const init: RequestInit = {
    method: options.method,
    headers,
    signal: options.signal,
  }

  if (options.body && options.method !== "GET") {
    init.body = JSON.stringify(options.body)
  }

  return fetch(url, init)
}

export const API = {
  getRequest(
    config: Config,
    path: string,
    queryParams?: Record<string, string | number | boolean | undefined>,
    signal?: AbortSignal,
  ): Promise<Response> {
    return apiRequest(config, { path, method: "GET", queryParams, signal })
  },

  postRequest(config: Config, path: string, body?: unknown): Promise<Response> {
    return apiRequest(config, { path, method: "POST", body })
  },

  putRequest(config: Config, path: string, body?: unknown): Promise<Response> {
    return apiRequest(config, { path, method: "PUT", body })
  },

  deleteRequest(config: Config, path: string, body?: unknown): Promise<Response> {
    return apiRequest(config, { path, method: "DELETE", body })
  },
}
