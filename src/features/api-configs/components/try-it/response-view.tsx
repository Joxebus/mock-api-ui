import { useState } from 'react'
import { CodeTextarea } from '../../../../components/code-textarea'
import type { RawResponse } from '../../../../types'
import type { ApiPath } from '../../types/api-configuration'
import { formatBody } from '../../utils/format-body'
import { compareResponse } from '../../utils/response-check'
import { ResponseChecks } from './response-checks'

/** Keeps the editor responsive for very large mock bodies. */
const MAX_DISPLAY_CHARS = 200_000

// Tomcat sends no reason phrase, so statusText is usually empty.
const REASONS: Record<number, string> = {
  200: 'OK', 201: 'Created', 202: 'Accepted', 204: 'No Content', 301: 'Moved Permanently',
  302: 'Found', 304: 'Not Modified', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
  404: 'Not Found', 405: 'Method Not Allowed', 406: 'Not Acceptable', 409: 'Conflict',
  415: 'Unsupported Media Type', 422: 'Unprocessable Entity', 500: 'Internal Server Error',
  502: 'Bad Gateway', 503: 'Service Unavailable',
}

type Tab = 'body' | 'headers'

interface ResponseViewProps {
  response: RawResponse
  expected: ApiPath
}

/** Status line, expected-vs-actual checks and Body/Headers tabs of a mock response. */
export function ResponseView({ response, expected }: ResponseViewProps) {
  const [tab, setTab] = useState<Tab>('body')
  const comparison = compareResponse(expected, response)
  const truncated = response.body.length > MAX_DISPLAY_CHARS
  const body = formatBody(truncated ? response.body.slice(0, MAX_DISPLAY_CHARS) : response.body)
  const rows = Math.min(Math.max(body.split('\n').length, 3), 15)

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-2 small">
        <span className={`badge ${statusBadgeClass(response.status)}`}>
          {response.status} {response.statusText || REASONS[response.status] || ''}
        </span>
        <span className="text-secondary">
          {response.durationMs} ms · {formatSize(response.sizeBytes)}
        </span>
      </div>
      <ResponseChecks comparison={comparison} />

      <ul className="nav nav-tabs nav-sm small">
        <li className="nav-item">
          <button type="button" className={`nav-link py-1 ${tab === 'body' ? 'active' : ''}`} onClick={() => setTab('body')}>
            Body
          </button>
        </li>
        <li className="nav-item">
          <button type="button" className={`nav-link py-1 ${tab === 'headers' ? 'active' : ''}`} onClick={() => setTab('headers')}>
            Headers ({response.headers.length})
          </button>
        </li>
      </ul>
      <div className="pt-2">
        {tab === 'body' ? (
          response.body ? (
            <>
              <CodeTextarea value={body} readOnly rows={rows} ariaLabel="Response body" />
              {truncated && (
                <div className="small text-secondary mt-1">
                  Showing the first {formatSize(MAX_DISPLAY_CHARS)} of {formatSize(response.sizeBytes)}.
                </div>
              )}
            </>
          ) : (
            <span className="text-secondary fst-italic small">(empty body)</span>
          )
        ) : (
          <table className="table table-sm small mb-0">
            <tbody>
              {response.headers.map(([name, value]) => (
                <tr key={name}>
                  <th scope="row" className="fw-normal text-secondary text-nowrap">{name}</th>
                  <td className="font-monospace text-break">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function statusBadgeClass(status: number): string {
  if (status >= 500) return 'text-bg-danger'
  if (status >= 400) return 'text-bg-warning'
  if (status >= 300) return 'text-bg-info'
  return 'text-bg-success'
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}
