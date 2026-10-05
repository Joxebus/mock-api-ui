import type { ApiConfiguration, ApiPath } from '../types/api-configuration'
import type { MockRequest } from '../types/mock-call'

/** Methods `fetch` refuses to send. */
const UNSENDABLE_METHODS = ['CONNECT', 'TRACE', 'TRACK']

/**
 * Build the configured request for one method of an operation. The backend
 * rejects anything without a JSON Content-Type (415, even for GET) and, for
 * secured APIs, compares the whole Authorization header with `authConfig`.
 */
export function buildMockRequest(
  config: Pick<ApiConfiguration, 'secured' | 'authConfig'>,
  href: string,
  path: ApiPath,
): MockRequest {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (config.secured && config.authConfig) headers.Authorization = config.authConfig
  return { href, method: path.method.trim().toUpperCase(), headers }
}

export function canSend(request: MockRequest): boolean {
  return !UNSENDABLE_METHODS.includes(request.method)
}
