interface MessageProps {
  message?: string
}

export function LoadingView({ message = 'Loading…' }: MessageProps) {
  return (
    <div className="d-flex align-items-center gap-2 text-secondary py-5 justify-content-center">
      <div className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}

export function ErrorView({ message = 'Something went wrong.' }: MessageProps) {
  return (
    <div className="alert alert-danger" role="alert">
      {message}
    </div>
  )
}

export function EmptyView({ message = 'Nothing to show yet.' }: MessageProps) {
  return (
    <div className="text-center text-secondary py-5">
      <p className="mb-0">{message}</p>
    </div>
  )
}

interface MethodBadgeProps {
  method: string
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-bg-success',
  POST: 'text-bg-primary',
  PUT: 'text-bg-warning',
  PATCH: 'text-bg-info',
  DELETE: 'text-bg-danger',
}

export function MethodBadge({ method }: MethodBadgeProps) {
  const upper = method.toUpperCase()
  const cls = METHOD_COLORS[upper] ?? 'text-bg-secondary'
  return <span className={`badge ${cls} font-monospace`}>{upper}</span>
}
