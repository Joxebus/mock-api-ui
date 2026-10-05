import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { ROUTES } from '@/config/routes'

/** Catch-all boundary for router navigation errors and unhandled render failures. */
export function RouteErrorBoundary() {
  const error = useRouteError()
  let title = 'Unexpected Error'
  let message = 'An unexpected error occurred while rendering this page.'

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`
    message = typeof error.data === 'string' ? error.data : error.statusText || message
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <div className="container py-5">
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading mb-2">{title}</h4>
        <p className="mb-0">{message}</p>
      </div>
      <Link to={ROUTES.home} className="btn btn-outline-primary">
        ← Back to APIs
      </Link>
    </div>
  )
}
