/** Pretty-print a body if it is JSON; otherwise return it as-is. */
export function formatBody(body: string): string {
  try {
    return JSON.stringify(JSON.parse(body), null, 2)
  } catch {
    return body
  }
}
