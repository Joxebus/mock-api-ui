/** Raw outcome of an HTTP call, as returned by sendRaw() in src/services. */
export interface RawResponse {
  status: number
  statusText: string
  /** [name, value] pairs; names lower-case, repeated headers joined with ", " by the browser. */
  headers: [string, string][]
  body: string
  durationMs: number
  sizeBytes: number
}
