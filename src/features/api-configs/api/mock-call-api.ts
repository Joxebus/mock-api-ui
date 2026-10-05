import { sendRaw } from '@/services'
import type { RawResponse } from '@/types'
import type { MockRequest } from '../types/mock-call'

/** Call a mock endpoint exactly as configured. Never throws on HTTP error statuses. */
export function callMock(signal: AbortSignal, request: MockRequest): Promise<RawResponse> {
  return sendRaw(request.href, { method: request.method, headers: request.headers, signal })
}
