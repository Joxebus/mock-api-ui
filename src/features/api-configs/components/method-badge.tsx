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
