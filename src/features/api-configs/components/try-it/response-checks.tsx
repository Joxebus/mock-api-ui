import type { ResponseComparison } from '../../types/mock-call'

interface ResponseChecksProps {
  comparison: ResponseComparison
}

/** ✓/✗ list comparing the response with the configured status, headers and body. */
export function ResponseChecks({ comparison }: ResponseChecksProps) {
  const failures = comparison.checks.filter((check) => !check.ok && check.detail)
  return (
    <div className="mb-2 small">
      <div className="d-flex align-items-center flex-wrap gap-1">
        <span className="text-secondary me-1">Expected vs actual:</span>
        {comparison.checks.map((check) => (
          <span
            key={check.label}
            className={`badge ${check.ok ? 'text-bg-success' : 'text-bg-danger'}`}
            title={check.detail}
          >
            {check.ok ? '✓' : '✗'} {check.label}
          </span>
        ))}
      </div>
      {failures.length > 0 && (
        <ul className="mb-0 mt-1 ps-3 text-danger-emphasis">
          {failures.map((check) => (
            <li key={check.label}>
              <strong>{check.label}:</strong> {check.detail}
            </li>
          ))}
        </ul>
      )}
      {comparison.hint && <div className="mt-1 text-secondary">💡 {comparison.hint}</div>}
    </div>
  )
}
