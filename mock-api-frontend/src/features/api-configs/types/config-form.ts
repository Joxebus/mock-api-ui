// The form works with a flatter, edit-friendly model than the wire ApiConfiguration.
// Key differences:
//  - `paths` (a map) becomes an ordered list of operations, each with an editable name.
//  - each method's `headers` map becomes a list of {key, value} rows, where value is a
//    comma-separated string (converted to string[] on serialize).
//  - numeric statusCode is kept as a string while editing.

export interface HeaderRow {
  key: string
  /** Comma-separated header values, e.g. "Omar Bautista, Joxebus". */
  value: string
}

export interface MethodForm {
  method: string
  statusCode: string
  headers: HeaderRow[]
  body: string
}

export interface OperationForm {
  name: string
  methods: MethodForm[]
}

export interface ConfigForm {
  name: string
  description: string
  termsOfService: string
  version: string
  contactName: string
  contactUrl: string
  contactEmail: string
  licenseName: string
  licenseUrl: string
  secured: boolean
  authConfig: string
  operations: OperationForm[]
}

/**
 * Per-field validation errors keyed by a path, e.g. "name", `op:${i}:name`,
 * `op:${i}:m:${j}:statusCode` (see utils/validation.ts).
 */
export type ValidationErrors = Record<string, string>
