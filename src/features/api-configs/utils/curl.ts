import type { MockRequest } from '../types/mock-call'

/** Quote a value for POSIX shells. */
function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

/** The request as a copy-pasteable curl command; `baseUrl` is e.g. http://localhost:5173. */
export function buildCurl(request: MockRequest, baseUrl: string): string {
  // -i prints the response headers. For HEAD use -I: curl -X HEAD waits for a body that never comes.
  const parts = ['curl', request.method === 'HEAD' ? '-I' : '-i']
  if (request.method !== 'GET' && request.method !== 'HEAD') parts.push('-X', request.method)
  for (const [name, value] of Object.entries(request.headers)) {
    parts.push('-H', shellQuote(`${name}: ${value}`))
  }
  parts.push(shellQuote(`${baseUrl}${request.href}`))
  return parts.join(' ')
}
