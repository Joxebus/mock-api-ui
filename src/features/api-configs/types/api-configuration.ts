// Types mirroring the backend JSON shapes produced by the custom serializers
// in the mock-api Spring service (see serializer/ package).

/** A single method definition under an operation (ApiPathSerializer). */
export interface ApiPath {
  method: string
  body: string | null
  statusCode: number
  headers: Record<string, string[]> | null
}

/** Full stored configuration (ApiConfigurationSerializer). GET /config/{apiName}. */
export interface ApiConfiguration {
  name: string
  description: string | null
  termsOfService: string | null
  version: string | null
  contact?: ApiContact
  license?: ApiLicense
  secured: boolean
  authConfig: string | null
  /** Operation name -> list of method definitions. */
  paths: Record<string, ApiPath[]>
}

export interface ApiContact {
  name?: string
  url?: string
  email?: string
}

export interface ApiLicense {
  name?: string
  url?: string
}

/** One operation summary (EndpointSerializer). */
export interface Endpoint {
  /** e.g. "/api/{apiName}/{operation}" */
  href: string
  /** e.g. [{ method: "get", statusCode: 200 }] */
  operations: EndpointOperation[]
}

export interface EndpointOperation {
  method: string
  statusCode: number
}

/** Discovery view for an API (EndpointConfigurationSerializer). GET /endpoint[/{apiName}]. */
export interface EndpointConfiguration {
  /** e.g. "/config/{apiName}" */
  config: string
  endpoints: Endpoint[]
}
