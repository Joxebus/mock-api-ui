import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorView, LoadingView } from '@/components'
import { ROUTES } from '@/config/routes'
import {
  ApiList,
  DeleteConfigurationModal,
  listEndpoints,
  useDeleteConfiguration,
} from '@/features/api-configs'
import { useAsync } from '@/hooks'

export function DashboardPage() {
  const [reloadKey, setReloadKey] = useState(0)
  const { data, loading, error } = useAsync(listEndpoints, [reloadKey])
  const deletion = useDeleteConfiguration(() => setReloadKey((k) => k + 1))

  if (loading) return <LoadingView message="Loading configured APIs…" />
  if (error) return <ErrorView message={error} />

  const configs = data ?? []

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center gap-2">
          <h1 className="h3 mb-0">Configured APIs</h1>
          <span className="badge text-bg-secondary rounded-pill">{configs.length}</span>
        </div>
        <Link to={ROUTES.newApi} className="btn btn-primary btn-sm">
          + Create API
        </Link>
      </div>

      <ApiList configs={configs} onDelete={deletion.requestDelete} />

      <DeleteConfigurationModal state={deletion} />
    </div>
  )
}
