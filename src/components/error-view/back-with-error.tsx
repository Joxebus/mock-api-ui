import { Link } from 'react-router-dom'
import { ROUTES } from '@/config/routes'
import { ErrorView } from './error-view'

interface BackWithErrorProps {
  message: string
}

/** Error alert followed by a link back to the API list. */
export function BackWithError({ message }: BackWithErrorProps) {
  return (
    <div>
      <ErrorView message={message} />
      <Link to={ROUTES.home} className="btn btn-outline-secondary btn-sm">
        ← Back to APIs
      </Link>
    </div>
  )
}
