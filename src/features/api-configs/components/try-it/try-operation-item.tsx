import { useId, useState } from 'react'
import type { ApiConfiguration, ApiPath } from '../../types/api-configuration'
import { buildMockRequest } from '../../utils/mock-request'
import { MethodBadge } from '../method-badge'
import { RequestRunner } from './request-runner'

interface TryOperationItemProps {
  operationName: string
  href?: string
  paths: ApiPath[]
  auth: Pick<ApiConfiguration, 'secured' | 'authConfig'>
  open: boolean
  onToggle: () => void
}

/** Accordion item for one operation: pick a configured method, then send it. */
export function TryOperationItem({ operationName, href, paths, auth, open, onToggle }: TryOperationItemProps) {
  const baseId = useId()
  const headingId = `${baseId}-heading`
  const collapseId = `${baseId}-collapse`
  const selectId = `${baseId}-method`
  const [methodIndex, setMethodIndex] = useState(0)
  const path = paths[methodIndex] ?? paths[0]

  return (
    <div className="accordion-item">
      <h2 className="accordion-header" id={headingId}>
        <button
          type="button"
          className={`accordion-button ${open ? '' : 'collapsed'}`}
          aria-expanded={open}
          aria-controls={collapseId}
          onClick={onToggle}
        >
          <span className="d-flex align-items-center gap-2 flex-wrap me-3">
            {paths.map((p, index) => (
              <MethodBadge key={`${p.method}-${index}`} method={p.method} />
            ))}
            <span className="fw-semibold">{operationName}</span>
            {href && <code className="small text-secondary">{href}</code>}
          </span>
        </button>
      </h2>
      <div
        id={collapseId}
        className={`accordion-collapse collapse ${open ? 'show' : ''}`}
        aria-labelledby={headingId}
      >
        {/* Mounted only while open, so closing the item aborts and discards its response. */}
        {open && (
          <div className="accordion-body">
            {!href || !path ? (
              <p className="text-secondary mb-0">This operation has no mock endpoint to call.</p>
            ) : (
              <RequestRunner
                // Remount on method change: aborts a running request and clears the response.
                key={methodIndex}
                request={buildMockRequest(auth, href, path)}
                expected={path}
                toolbarStart={
                  <>
                    <label htmlFor={selectId} className="visually-hidden">
                      Method
                    </label>
                    <select
                      id={selectId}
                      className="form-select form-select-sm w-auto"
                      value={methodIndex}
                      onChange={(e) => setMethodIndex(Number(e.target.value))}
                    >
                      {paths.map((p, index) => (
                        <option key={`${p.method}-${index}`} value={index}>
                          {p.method.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <span className="small text-secondary text-nowrap">expects HTTP {path.statusCode}</span>
                  </>
                }
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
