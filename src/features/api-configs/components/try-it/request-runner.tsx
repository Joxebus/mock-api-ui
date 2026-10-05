import { useState, type ReactNode } from 'react'
import { ErrorView } from '@/components'
import { BACKEND_URL } from '@/config/env'
import type { ApiPath } from '../../types/api-configuration'
import type { MockRequest } from '../../types/mock-call'
import { useMockCall } from '../../hooks/use-mock-call'
import { buildCurl } from '../../utils/curl'
import { canSend } from '../../utils/mock-request'
import { MethodBadge } from '../method-badge'
import { ResponseView } from './response-view'

const COPY_FEEDBACK_MS = 1500

interface RequestRunnerProps {
  request: MockRequest
  expected: ApiPath
  /** Rendered at the start of the toolbar (e.g. the method picker). */
  toolbarStart?: ReactNode
}

/**
 * Shows the configured request, sends it to the mock (Send / Cancel, Copy curl)
 * and compares the response with the configuration. Unmounting aborts the call.
 */
export function RequestRunner({ request, expected, toolbarStart }: RequestRunnerProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const call = useMockCall()
  const sendable = canSend(request)

  const copyCurl = async () => {
    try {
      // Point at the backend itself, not the UI's proxy, so the command works without the UI.
      await navigator.clipboard.writeText(buildCurl(request, BACKEND_URL))
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
    setTimeout(() => setCopyState('idle'), COPY_FEEDBACK_MS)
  }

  return (
    <section aria-label={`Try ${request.method} ${request.href}`}>
      <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
        {toolbarStart ?? <MethodBadge method={request.method} />}
        <code className="small">{request.href}</code>
        <div className="ms-auto d-flex gap-2">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={copyCurl}>
            {copyState === 'copied' ? 'Copied!' : copyState === 'failed' ? 'Copy failed' : 'Copy curl'}
          </button>
          {call.running ? (
            <button type="button" className="btn btn-outline-danger btn-sm" onClick={call.cancel}>
              <span className="spinner-border spinner-border-sm me-1" aria-hidden="true" />
              Cancel
            </button>
          ) : (
            <button type="button" className="btn btn-primary btn-sm" disabled={!sendable} onClick={() => call.run(request)}>
              Send
            </button>
          )}
        </div>
      </div>
      <div className="small font-monospace text-secondary mb-2">
        {Object.entries(request.headers).map(([name, value]) => (
          <div key={name}>
            {name}: {value}
          </div>
        ))}
      </div>
      {!sendable && (
        <div className="small text-secondary mb-2">
          Browsers can't send {request.method} requests; use Copy curl instead.
        </div>
      )}

      <div aria-live="polite">
        {call.error && <ErrorView message={call.error} />}
        {call.data && !call.error && (
          <>
            <hr className="my-2" />
            <ResponseView response={call.data} expected={expected} />
          </>
        )}
      </div>
    </section>
  )
}
