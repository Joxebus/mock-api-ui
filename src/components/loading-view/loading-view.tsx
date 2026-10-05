interface LoadingViewProps {
  message?: string
}

export function LoadingView({ message = 'Loading…' }: LoadingViewProps) {
  return (
    <div className="d-flex align-items-center gap-2 text-secondary py-5 justify-content-center">
      <div className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}
