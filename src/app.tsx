import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ROUTE_PATTERNS } from './config/routes'
import { MainLayout } from './layouts/main-layout'
import { ApiDetailPage } from './pages/api-detail-page'
import { ConfigEditorPage } from './pages/config-editor-page'
import { DashboardPage } from './pages/dashboard-page'

const router = createBrowserRouter([
  {
    path: ROUTE_PATTERNS.home,
    element: <MainLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: ROUTE_PATTERNS.newApi, element: <ConfigEditorPage /> },
      { path: ROUTE_PATTERNS.editApi, element: <ConfigEditorPage /> },
      { path: ROUTE_PATTERNS.apiDetail, element: <ApiDetailPage /> },
    ],
  },
])

/** Root component: hosts app-wide providers and the router. */
export function App() {
  return <RouterProvider router={router} />
}
