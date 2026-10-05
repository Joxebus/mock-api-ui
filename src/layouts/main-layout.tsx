import { Link, Outlet } from 'react-router-dom'
import { ROUTES } from '../config/routes'

export function MainLayout() {
  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <Link className="navbar-brand fw-semibold" to={ROUTES.home}>
            Mock API <span className="text-secondary fw-normal">Console</span>
          </Link>
        </div>
      </nav>
      <main className="container py-4">
        <Outlet />
      </main>
    </>
  )
}
