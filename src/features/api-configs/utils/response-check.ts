import type { RawResponse } from '@/types'
import type { ApiPath } from '../types/api-configuration'
import type { ResponseCheck, ResponseComparison } from '../types/mock-call'

const STATUS_HINTS: Record<number, string> = {
  401: 'The Authorization header was rejected. Check that authConfig is set and the configuration was saved.',
  404: 'The API or operation was not found. The configuration may have changed or been deleted — reload the page.',
  405: 'This method is no longer configured for the operation. Reload the page.',
  406: 'The backend only produces application/json.',
  415: 'The backend only accepts requests with Content-Type: application/json.',
}

/** Compare a real response with what the method definition says it returns. */
export function compareResponse(expected: ApiPath, actual: RawResponse): ResponseComparison {
  const statusOk = actual.status === expected.statusCode
  const checks: ResponseCheck[] = [
    {
      label: `Status ${expected.statusCode}`,
      ok: statusOk,
      detail: statusOk ? undefined : `Expected ${expected.statusCode}, got ${actual.status}.`,
    },
  ]
  if (!statusOk) {
    return {
      checks,
      hint: STATUS_HINTS[actual.status] ?? (actual.status >= 500 ? 'The backend failed; check its logs.' : undefined),
    }
  }

  const actualHeaders = new Map(actual.headers.map(([name, value]) => [name.toLowerCase(), value]))
  for (const [name, values] of Object.entries(expected.headers ?? {})) {
    // The browser joins repeated header lines with ", ".
    const want = values.join(', ')
    const got = actualHeaders.get(name.toLowerCase())
    checks.push({
      label: name,
      ok: got === want,
      detail: got === undefined ? 'Header missing from the response.' : got === want ? undefined : `Expected "${want}", got "${got}".`,
    })
  }

  checks.push(compareBody(expected.body, actual.body))
  return { checks }
}

function compareBody(expected: string | null, actual: string): ResponseCheck {
  const label = 'Body'
  const want = (expected ?? '').trim()
  const got = actual.trim()
  if (!want || !got) {
    if (!want && !got) return { label, ok: true }
    return { label, ok: false, detail: want ? 'Expected a body, got an empty response.' : 'Expected an empty body.' }
  }
  const wantJson = tryParse(want)
  const gotJson = tryParse(got)
  if (wantJson.ok && gotJson.ok) {
    // Key order and whitespace don't matter for JSON bodies.
    const ok = deepEqual(wantJson.value, gotJson.value)
    return { label, ok, detail: ok ? undefined : 'JSON differs from the configured body.' }
  }
  const ok = want === got
  return { label, ok, detail: ok ? undefined : 'Text differs from the configured body.' }
}

function tryParse(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch {
    return { ok: false }
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => deepEqual(item, b[i]))
  }
  const aRecord = a as Record<string, unknown>
  const bRecord = b as Record<string, unknown>
  const keys = Object.keys(aRecord)
  return (
    keys.length === Object.keys(bRecord).length &&
    keys.every((key) => Object.hasOwn(bRecord, key) && deepEqual(aRecord[key], bRecord[key]))
  )
}
