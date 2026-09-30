import { createBrowserRouter } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ApiDetail from './pages/ApiDetail'
import ConfigEditor from './pages/ConfigEditor'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'apis/new', element: <ConfigEditor /> },
      { path: 'apis/:apiName/edit', element: <ConfigEditor /> },
      { path: 'apis/:apiName', element: <ApiDetail /> },
    ],
  },
])
