import type { ApiConfiguration, EndpointConfiguration, ResponseError } from './types'

// Empty base => rely on the Vite dev proxy (same-origin). Set VITE_API_BASE_URL
// to e.g. "http://localhost:8080" to hit the backend directly (uses CORS).
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { Accept: 'application/json', ...init?.headers },
      ...init,
    })
  } catch (cause) {
    throw new ApiError(
      'Could not reach the mock-api backend. Is it running on :8080?',
      0,
    )
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const body = (await response.json()) as ResponseError
      if (body?.message) message = body.message
    } catch {
      // response had no JSON error body; keep the default message
    }
    throw new ApiError(message, response.status)
  }

  return (await response.json()) as T
}

function getJson<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' })
}

/** Extract "{apiName}" from a config path like "/config/{apiName}". */
export function apiNameFromConfigPath(configPath: string): string {
  const parts = configPath.split('/').filter(Boolean)
  return parts[parts.length - 1] ?? ''
}

/** GET /endpoint — list all configured APIs. */
export function listEndpoints(): Promise<EndpointConfiguration[]> {
  return getJson<EndpointConfiguration[]>('/endpoint')
}

/** GET /endpoint/{apiName} — endpoints for one API. */
export function getEndpoint(apiName: string): Promise<EndpointConfiguration> {
  return getJson<EndpointConfiguration>(`/endpoint/${encodeURIComponent(apiName)}`)
}

/** GET /config/{apiName} — raw stored configuration for one API. */
export function getConfiguration(apiName: string): Promise<ApiConfiguration> {
  return getJson<ApiConfiguration>(`/config/${encodeURIComponent(apiName)}`)
}

/**
 * POST /config — create or update a configuration. Returns the derived
 * EndpointConfiguration (201). Throws ApiError with the backend message on
 * validation (400) or server (500) errors.
 */
export function createConfiguration(
  config: ApiConfiguration,
): Promise<EndpointConfiguration> {
  return request<EndpointConfiguration>('/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
}

/**
 * DELETE /config/{apiName} — remove a configuration. Resolves on 200 (the
 * backend returns a {message} body). Throws ApiError with the backend message
 * when the configuration does not exist (404).
 */
export function deleteConfiguration(apiName: string): Promise<ResponseError> {
  return request<ResponseError>(`/config/${encodeURIComponent(apiName)}`, {
    method: 'DELETE',
  })
}
