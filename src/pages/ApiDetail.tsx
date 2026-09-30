import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError, deleteConfiguration, getConfiguration, getEndpoint } from '../api/client'
import type { ApiPath } from '../api/types'
import { useAsync } from '../hooks/useAsync'
import { ErrorView, LoadingView, MethodBadge } from '../components/StatusViews'
import ConfirmModal from '../components/ConfirmModal'

export default function ApiDetail() {
  const { apiName = '' } = useParams()
  const navigate = useNavigate()

  const { data, loading, error } = useAsync(
    () => Promise.all([getConfiguration(apiName), getEndpoint(apiName)]),
    [apiName],
  )

  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const confirmDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteConfiguration(apiName)
      navigate('/')
    } catch (e) {
      setDeleteError(e instanceof ApiError ? e.message : 'Failed to delete the configuration.')
      setDeleting(false)
    }
  }

  if (loading) return <LoadingView message={`Loading "${apiName}"…`} />
  if (error) return <BackWithError message={error} />
  if (!data) return <BackWithError message="No data available." />

  const [config, endpointConfig] = data

  // Map operation name -> mock href, from the endpoint discovery view.
  const hrefByOperation = new Map<string, string>()
  for (const ep of endpointConfig.endpoints) {
    const operationName = ep.href.split('/').filter(Boolean).pop() ?? ''
    hrefByOperation.set(operationName, ep.href)
  }

  const operationNames = Object.keys(config.paths)

  return (
    <div>
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">APIs</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {config.name}
          </li>
        </ol>
      </nav>

      <div className="d-flex align-items-center gap-2 mb-2">
        <h1 className="h3 mb-0">{config.name}</h1>
        {config.secured ? (
          <span className="badge text-bg-warning">🔒 secured</span>
        ) : (
          <span className="badge text-bg-secondary">public</span>
        )}
        {config.version && <span className="badge text-bg-light text-dark border">v{config.version}</span>}
        <div className="btn-group btn-group-sm ms-auto" role="group">
          <Link to={`/apis/${encodeURIComponent(config.name)}/edit`} className="btn btn-outline-secondary">
            Edit
          </Link>
          <button type="button" className="btn btn-outline-danger" onClick={() => setShowDelete(true)}>
            Delete
          </button>
        </div>
      </div>
      {config.description && <p className="text-secondary">{config.description}</p>}

      <MetadataCard
        termsOfService={config.termsOfService}
        contactName={config.contact?.name}
        contactEmail={config.contact?.email}
        contactUrl={config.contact?.url}
        licenseName={config.license?.name}
        licenseUrl={config.license?.url}
        secured={config.secured}
        authConfig={config.authConfig}
      />

      <h2 className="h5 mt-4 mb-3">Operations</h2>
      {operationNames.length === 0 ? (
        <p className="text-secondary">This API has no operations configured.</p>
      ) : (
        <OperationsAccordion
          operationNames={operationNames}
          hrefByOperation={hrefByOperation}
          paths={config.paths}
        />
      )}

      <ConfirmModal
        show={showDelete}
        title="Delete configuration"
        confirmLabel="Delete"
        busy={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setShowDelete(false)}
      >
        <p className="mb-0">
          Delete the configuration <strong>{config.name}</strong>? This removes its stored YAML and
          the mocked endpoints it serves. This action cannot be undone.
        </p>
      </ConfirmModal>
    </div>
  )
}

interface OperationsAccordionProps {
  operationNames: string[]
  hrefByOperation: Map<string, string>
  paths: Record<string, ApiPath[]>
}

function OperationsAccordion({ operationNames, hrefByOperation, paths }: OperationsAccordionProps) {
  // Controlled accordion: all operations start collapsed. Uses Bootstrap's
  // accordion CSS with React state (no Bootstrap JS bundle needed).
  const [openOperation, setOpenOperation] = useState<string | null>(null)

  return (
    <div className="accordion" id="operations-accordion">
      {operationNames.map((operationName) => (
        <OperationAccordionItem
          key={operationName}
          operationName={operationName}
          href={hrefByOperation.get(operationName)}
          paths={paths[operationName]}
          open={openOperation === operationName}
          onToggle={() =>
            setOpenOperation((current) => (current === operationName ? null : operationName))
          }
        />
      ))}
    </div>
  )
}

function BackWithError({ message }: { message: string }) {
  return (
    <div>
      <ErrorView message={message} />
      <Link to="/" className="btn btn-outline-secondary btn-sm">
        ← Back to APIs
      </Link>
    </div>
  )
}

interface MetadataCardProps {
  termsOfService: string | null
  contactName?: string
  contactEmail?: string
  contactUrl?: string
  licenseName?: string
  licenseUrl?: string
  secured: boolean
  authConfig: string | null
}

function MetadataCard(props: MetadataCardProps) {
  const { termsOfService, contactName, contactEmail, contactUrl, licenseName, licenseUrl, secured, authConfig } = props
  return (
    <div className="card">
      <div className="card-body">
        <dl className="row mb-0">
          <Row label="Terms of service">
            {termsOfService ? <a href={termsOfService}>{termsOfService}</a> : <Muted />}
          </Row>
          <Row label="Contact">
            {contactName || contactEmail || contactUrl ? (
              <>
                {contactName}
                {contactEmail && (
                  <>
                    {' '}
                    <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                  </>
                )}
                {contactUrl && (
                  <>
                    {' · '}
                    <a href={contactUrl}>{contactUrl}</a>
                  </>
                )}
              </>
            ) : (
              <Muted />
            )}
          </Row>
          <Row label="License">
            {licenseName ? (
              licenseUrl ? <a href={licenseUrl}>{licenseName}</a> : licenseName
            ) : (
              <Muted />
            )}
          </Row>
          {secured && (
            <Row label="Auth header">
              <code>Authorization: {authConfig}</code>
            </Row>
          )}
        </dl>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="col-sm-3 text-secondary fw-normal">{label}</dt>
      <dd className="col-sm-9">{children}</dd>
    </>
  )
}

function Muted() {
  return <span className="text-secondary fst-italic">—</span>
}

interface OperationAccordionItemProps {
  operationName: string
  href?: string
  paths: ApiPath[]
  open: boolean
  onToggle: () => void
}

function OperationAccordionItem({ operationName, href, paths, open, onToggle }: OperationAccordionItemProps) {
  const headingId = `heading-${operationName}`
  const collapseId = `collapse-${operationName}`

  return (
    <div className="accordion-item">
      <h3 className="accordion-header" id={headingId}>
        <button
          type="button"
          className={`accordion-button ${open ? '' : 'collapsed'}`}
          aria-expanded={open}
          aria-controls={collapseId}
          onClick={onToggle}
        >
          <span className="d-flex align-items-center gap-2 flex-wrap me-3">
            {paths.map((path, index) => (
              <MethodBadge key={`${path.method}-${index}`} method={path.method} />
            ))}
            <span className="fw-semibold">{operationName}</span>
            {href && !open && <code className="small text-secondary">({href})</code>}
          </span>
        </button>
      </h3>
      <div
        id={collapseId}
        className={`accordion-collapse collapse ${open ? 'show' : ''}`}
        aria-labelledby={headingId}
      >
        <div className="accordion-body">
          <ul className="list-group list-group-flush">
            {paths.map((path, index) => (
              <li key={`${path.method}-${index}`} className="list-group-item px-0">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <MethodBadge method={path.method} />
                  <span className="badge text-bg-light text-dark border">HTTP {path.statusCode}</span>
                </div>
                {href && (
                  <div className="mb-2 small">
                    <span className="text-secondary">Endpoint:</span>{' '}
                    <code className="badge text-bg-light text-dark border me-1">{href}</code>
                  </div>
                )}
                {path.headers && Object.keys(path.headers).length > 0 && (
                  <div className="mb-2 small">
                    <span className="text-secondary">Headers:</span>{' '}
                    {Object.entries(path.headers).map(([key, values]) => (
                      <span key={key} className="badge text-bg-light text-dark border me-1">
                        {key}: {values.join(', ')}
                      </span>
                    ))}
                  </div>
                )}
                {path.body ? (
                  <pre className="bg-light border rounded p-2 mb-0 small overflow-auto">
                    <code>{formatBody(path.body)}</code>
                  </pre>
                ) : (
                  <span className="text-secondary fst-italic small">No response body</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

/** Pretty-print the response body if it is JSON; otherwise return it as-is. */
function formatBody(body: string): string {
  try {
    return JSON.stringify(JSON.parse(body), null, 2)
  } catch {
    return body
  }
}
