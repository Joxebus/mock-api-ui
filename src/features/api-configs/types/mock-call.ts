/** A request "Try it" sends to a mock endpoint, fully derived from the configuration. */
export interface MockRequest {
  /** From EndpointConfiguration, e.g. /api/users-api/users */
  href: string
  /** Upper-case HTTP method. */
  method: string
  headers: Record<string, string>
}

/** One line of the expected-vs-actual comparison. */
export interface ResponseCheck {
  label: string
  ok: boolean
  detail?: string
}

export interface ResponseComparison {
  checks: ResponseCheck[]
  /** Likely cause when the status code doesn't match. */
  hint?: string
}
