import { API_BASE_URL } from '../config/env'
import type { RawResponse, ResponseError } from '../types'

export class ApiError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Return the ApiError message, or `fallback` for any other thrown value. */
export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

const UNREACHABLE_MESSAGE = 'Could not reach the mock-api backend. Is it running on :8080?'

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Merge after spreading `init`, so caller headers don't drop the default Accept.
  const headers = new Headers(init?.headers)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(UNREACHABLE_MESSAGE, 0)
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

export function getJson<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' })
}

/**
 * Send a request and return the raw outcome (status, headers, text body, timing).
 * Unlike request(), HTTP error statuses are returned, not thrown. Throws
 * ApiError(…, 0) only when the backend can't be reached; aborts are rethrown as-is.
 */
export async function sendRaw(path: string, init?: RequestInit): Promise<RawResponse> {
  const started = performance.now()
  let response: Response
  let body: string
  try {
    response = await fetch(`${API_BASE_URL}${path}`, init)
    body = await response.text()
  } catch (e) {
    if (init?.signal?.aborted) throw e
    throw new ApiError(UNREACHABLE_MESSAGE, 0)
  }
  return {
    status: response.status,
    statusText: response.statusText,
    headers: [...response.headers.entries()],
    body,
    durationMs: Math.round(performance.now() - started),
    sizeBytes: new TextEncoder().encode(body).length,
  }
}
