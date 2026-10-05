import { API_BASE_URL } from '../config/env'
import type { ResponseError } from '../types'

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

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: 'application/json', ...init?.headers },
      ...init,
    })
  } catch {
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

export function getJson<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' })
}
