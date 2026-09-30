interface ConfirmModalProps {
  show: boolean
  title: string
  confirmLabel?: string
  confirmClass?: string
  busy?: boolean
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
  children: React.ReactNode
}

/**
 * Controlled Bootstrap modal (uses the modal CSS classes with a rendered
 * backdrop — no Bootstrap JS bundle needed).
 */
export default function ConfirmModal({
  show,
  title,
  confirmLabel = 'Confirm',
  confirmClass = 'btn-danger',
  busy = false,
  error = null,
  onConfirm,
  onCancel,
  children,
}: ConfirmModalProps) {
  if (!show) return null

  return (
    <>
      <div
        className="modal fade show d-block"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onClick={onCancel}
      >
        <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onCancel}
                disabled={busy}
              />
            </div>
            <div className="modal-body">
              {children}
              {error && (
                <div className="alert alert-danger mt-3 mb-0" role="alert">
                  {error}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={busy}>
                Cancel
              </button>
              <button type="button" className={`btn ${confirmClass}`} onClick={onConfirm} disabled={busy}>
                {busy ? 'Working…' : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  )
}
