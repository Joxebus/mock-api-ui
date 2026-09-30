import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiNameFromConfigPath, deleteConfiguration, listEndpoints, ApiError } from '../api/client'
import { useAsync } from '../hooks/useAsync'
import { EmptyView, ErrorView, LoadingView } from '../components/StatusViews'
import ConfirmModal from '../components/ConfirmModal'

export default function Dashboard() {
  const [reloadKey, setReloadKey] = useState(0)
  const { data, loading, error } = useAsync(listEndpoints, [reloadKey])

  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteConfiguration(pendingDelete)
      setPendingDelete(null)
      setReloadKey((k) => k + 1)
    } catch (e) {
      setDeleteError(e instanceof ApiError ? e.message : 'Failed to delete the configuration.')
    } finally {
      setDeleting(false)
    }
  }

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
        <Link to="/apis/new" className="btn btn-primary btn-sm">
          + Create API
        </Link>
      </div>

      {configs.length === 0 ? (
        <div className="text-center py-5">
          <EmptyView message="No API configurations found." />
          <Link to="/apis/new" className="btn btn-primary">
            + Create your first API
          </Link>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th scope="col">API name</th>
                <th scope="col" className="text-center">Operations</th>
                <th scope="col" className="text-center">Total methods</th>
                <th scope="col" className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((config) => {
                const apiName = apiNameFromConfigPath(config.config)
                const operationCount = config.endpoints.length
                const methodCount = config.endpoints.reduce(
                  (sum, ep) => sum + ep.operations.length,
                  0,
                )
                return (
                  <tr key={apiName}>
                    <td>
                      <Link to={`/apis/${encodeURIComponent(apiName)}`} className="fw-semibold text-decoration-none">
                        {apiName}
                      </Link>
                    </td>
                    <td className="text-center">{operationCount}</td>
                    <td className="text-center">{methodCount}</td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm" role="group">
                        <Link
                          to={`/apis/${encodeURIComponent(apiName)}`}
                          className="btn btn-outline-primary"
                        >
                          View
                        </Link>
                        <Link
                          to={`/apis/${encodeURIComponent(apiName)}/edit`}
                          className="btn btn-outline-secondary"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => {
                            setDeleteError(null)
                            setPendingDelete(apiName)
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        show={pendingDelete !== null}
        title="Delete configuration"
        confirmLabel="Delete"
        busy={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      >
        <p className="mb-0">
          Delete the configuration <strong>{pendingDelete}</strong>? This removes its stored YAML and
          the mocked endpoints it serves. This action cannot be undone.
        </p>
      </ConfirmModal>
    </div>
  )
}
