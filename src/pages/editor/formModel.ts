import type { ApiConfiguration, ApiPath } from '../../api/types'

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

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const

export function emptyMethod(): MethodForm {
  return { method: 'GET', statusCode: '200', headers: [], body: '' }
}

export function emptyOperation(): OperationForm {
  return { name: '', methods: [emptyMethod()] }
}

export function emptyConfigForm(): ConfigForm {
  return {
    name: '',
    description: '',
    termsOfService: '',
    version: '',
    contactName: '',
    contactUrl: '',
    contactEmail: '',
    licenseName: '',
    licenseUrl: '',
    secured: false,
    authConfig: '',
    operations: [emptyOperation()],
  }
}

// ---------------------------------------------------------------------------
// Serialize: ConfigForm -> ApiConfiguration (wire shape)
// ---------------------------------------------------------------------------

function trimToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

function headersToMap(rows: HeaderRow[]): Record<string, string[]> | null {
  const entries = rows.filter((row) => row.key.trim().length > 0)
  if (entries.length === 0) return null
  const map: Record<string, string[]> = {}
  for (const row of entries) {
    map[row.key.trim()] = row.value
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
  }
  return map
}

export function formToConfig(form: ConfigForm): ApiConfiguration {
  const paths: Record<string, ApiPath[]> = {}
  for (const operation of form.operations) {
    const opName = operation.name.trim()
    if (opName.length === 0) continue
    paths[opName] = operation.methods.map((m) => ({
      method: m.method.trim(),
      body: trimToNull(m.body),
      statusCode: Number(m.statusCode),
      headers: headersToMap(m.headers),
    }))
  }

  const config: ApiConfiguration = {
    name: form.name.trim(),
    description: trimToNull(form.description),
    termsOfService: trimToNull(form.termsOfService),
    version: trimToNull(form.version),
    secured: form.secured,
    authConfig: trimToNull(form.authConfig),
    paths,
  }

  const contactName = trimToNull(form.contactName)
  const contactUrl = trimToNull(form.contactUrl)
  const contactEmail = trimToNull(form.contactEmail)
  if (contactName || contactUrl || contactEmail) {
    config.contact = {
      ...(contactName ? { name: contactName } : {}),
      ...(contactUrl ? { url: contactUrl } : {}),
      ...(contactEmail ? { email: contactEmail } : {}),
    }
  }

  const licenseName = trimToNull(form.licenseName)
  const licenseUrl = trimToNull(form.licenseUrl)
  if (licenseName || licenseUrl) {
    config.license = {
      ...(licenseName ? { name: licenseName } : {}),
      ...(licenseUrl ? { url: licenseUrl } : {}),
    }
  }

  return config
}

// ---------------------------------------------------------------------------
// Deserialize: ApiConfiguration (wire shape) -> ConfigForm
// (used by the JSON tab to sync edits back into the form)
// ---------------------------------------------------------------------------

function mapToHeaders(map: Record<string, string[]> | null | undefined): HeaderRow[] {
  if (!map) return []
  return Object.entries(map).map(([key, values]) => ({
    key,
    value: Array.isArray(values) ? values.join(', ') : String(values),
  }))
}

export function configToForm(config: ApiConfiguration): ConfigForm {
  const operations: OperationForm[] = Object.entries(config.paths ?? {}).map(
    ([name, methods]) => ({
      name,
      methods: (methods ?? []).map((m) => ({
        method: (m.method ?? '').toUpperCase(),
        statusCode: m.statusCode != null ? String(m.statusCode) : '',
        headers: mapToHeaders(m.headers),
        body: m.body ?? '',
      })),
    }),
  )

  return {
    name: config.name ?? '',
    description: config.description ?? '',
    termsOfService: config.termsOfService ?? '',
    version: config.version ?? '',
    contactName: config.contact?.name ?? '',
    contactUrl: config.contact?.url ?? '',
    contactEmail: config.contact?.email ?? '',
    licenseName: config.license?.name ?? '',
    licenseUrl: config.license?.url ?? '',
    secured: config.secured ?? false,
    authConfig: config.authConfig ?? '',
    operations: operations.length > 0 ? operations : [emptyOperation()],
  }
}
