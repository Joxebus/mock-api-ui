import { Link } from 'react-router-dom'
import { EmptyView } from '@/components'
import { ROUTES } from '@/config/routes'
import type { EndpointConfiguration } from '../types/api-configuration'
import { apiNameFromConfigPath } from '../utils/api-name'

interface ApiListProps {
  configs: EndpointConfiguration[]
  onDelete: (apiName: string) => void
}

/** Table of configured APIs, or an empty state with a create link. */
export function ApiList({ configs, onDelete }: ApiListProps) {
  if (configs.length === 0) {
    return (
      <div className="text-center py-5">
        <EmptyView message="No API configurations found." />
        <Link to={ROUTES.newApi} className="btn btn-primary">
          + Create your first API
        </Link>
      </div>
    )
  }

  return (
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
                  <Link to={ROUTES.apiDetail(apiName)} className="fw-semibold text-decoration-none">
                    {apiName}
                  </Link>
                </td>
                <td className="text-center">{operationCount}</td>
                <td className="text-center">{methodCount}</td>
                <td className="text-end">
                  <div className="btn-group btn-group-sm" role="group">
                    <Link to={ROUTES.apiDetail(apiName)} className="btn btn-outline-primary">
                      View
                    </Link>
                    <Link to={ROUTES.editApi(apiName)} className="btn btn-outline-secondary">
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={() => onDelete(apiName)}
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
  )
}
