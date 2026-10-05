import type { LintProblem, LintResult } from '../../types/json-lint'

interface JsonLintPanelProps {
  result: LintResult
  /** True while the latest edits have not been linted yet. */
  pending: boolean
  onSelect: (problem: LintProblem) => void
}

/** "Problems" list for the JSON tab; clicking a problem jumps to it. */
export function JsonLintPanel({ result, pending, onSelect }: JsonLintPanelProps) {
  const { problems } = result
  const errorCount = problems.filter((p) => p.severity === 'error').length
  const warningCount = problems.length - errorCount

  return (
    <div className="card mt-2">
      <div className="card-header d-flex align-items-center gap-2 py-2 small">
        <strong>Problems</strong>
        {pending ? (
          <span className="text-secondary">Checking…</span>
        ) : problems.length === 0 ? (
          <span className="text-success">✓ No problems found</span>
        ) : (
          <>
            {errorCount > 0 && (
              <span className="badge text-bg-danger">
                {errorCount} {errorCount === 1 ? 'error' : 'errors'}
              </span>
            )}
            {warningCount > 0 && (
              <span className="badge text-bg-warning">
                {warningCount} {warningCount === 1 ? 'warning' : 'warnings'}
              </span>
            )}
          </>
        )}
      </div>
      {problems.length > 0 && (
        <div className="list-group list-group-flush small overflow-auto" style={{ maxHeight: '14rem' }}>
          {problems.map((problem, index) => (
            <button
              key={`${problem.offset}-${index}`}
              type="button"
              className="list-group-item list-group-item-action d-flex align-items-baseline gap-2"
              onClick={() => onSelect(problem)}
            >
              <span
                className={`badge ${problem.severity === 'error' ? 'text-bg-danger' : 'text-bg-warning'}`}
              >
                {problem.severity}
              </span>
              <span className="text-secondary font-monospace text-nowrap">
                Ln {problem.line}, Col {problem.column}
              </span>
              <span className="flex-grow-1">{problem.message}</span>
              {problem.path && <code className="text-nowrap">{problem.path}</code>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
