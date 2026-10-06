import { getJson, request } from '@/services'
import type { ResponseError } from '@/types'
import type { ApiConfiguration, EndpointConfiguration } from '@/features/api-configs'

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
