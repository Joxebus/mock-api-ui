import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../../../config/routes'
import type { ApiConfiguration, EndpointConfiguration } from '../../types/api-configuration'
import { hrefByOperation as buildHrefByOperation } from '../../utils/endpoint-hrefs'
import { TryOperationItem } from './try-operation-item'

interface TryApiViewProps {
  config: ApiConfiguration
  endpointConfig: EndpointConfiguration
}

/** "Try it" page body: one accordion item per operation, each able to send a configured method. */
export function TryApiView({ config, endpointConfig }: TryApiViewProps) {
  const hrefByOperation = buildHrefByOperation(config.name, endpointConfig)
  const operationNames = Object.keys(config.paths)
  // Controlled accordion (no Bootstrap JS): one item open at a time, the first on load.
  const [openOperation, setOpenOperation] = useState<string | null>(operationNames[0] ?? null)
  const auth = { secured: config.secured, authConfig: config.authConfig }

  return (
    <div>
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to={ROUTES.home}>APIs</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to={ROUTES.apiDetail(config.name)}>{config.name}</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Try it
          </li>
        </ol>
      </nav>

      <div className="d-flex align-items-center gap-2 mb-2">
        <h1 className="h3 mb-0">Try {config.name}</h1>
        {config.secured ? (
          <span className="badge text-bg-warning">🔒 secured</span>
        ) : (
          <span className="badge text-bg-secondary">public</span>
        )}
        <Link to={ROUTES.apiDetail(config.name)} className="btn btn-outline-secondary btn-sm ms-auto">
          ← Back to details
        </Link>
      </div>
      <p className="text-secondary small">
        Pick a method for an endpoint and send it. Mocks are stateless: sending requests never changes any data.
      </p>

      {operationNames.length === 0 ? (
        <p className="text-secondary">This API has no operations configured.</p>
      ) : (
        <div className="accordion">
          {operationNames.map((operationName) => (
            <TryOperationItem
              key={operationName}
              operationName={operationName}
              href={hrefByOperation.get(operationName)}
              paths={config.paths[operationName]}
              auth={auth}
              open={openOperation === operationName}
              onToggle={() =>
                setOpenOperation((current) => (current === operationName ? null : operationName))
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
