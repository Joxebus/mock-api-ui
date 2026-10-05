import { useState } from 'react'
import type {
  ConfigForm,
  HeaderRow,
  MethodForm,
  OperationForm,
  ValidationErrors,
} from '../../types/config-form'
import { emptyMethod, emptyOperation, HTTP_METHODS } from '../../utils/form-model'
import { MethodBadge } from '../method-badge'

interface ConfigFormFieldsProps {
  form: ConfigForm
  errors: ValidationErrors
  onChange: (form: ConfigForm) => void
}

export function ConfigFormFields({ form, errors, onChange }: ConfigFormFieldsProps) {
  // Which operation accordion item is expanded (by index). Only one at a time.
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const set = (patch: Partial<ConfigForm>) => onChange({ ...form, ...patch })

  const setOperation = (index: number, operation: OperationForm) => {
    const operations = form.operations.slice()
    operations[index] = operation
    set({ operations })
  }

  const addOperation = () => {
    set({ operations: [...form.operations, emptyOperation()] })
    setOpenIndex(form.operations.length) // open the newly added operation
  }

  const removeOperation = (index: number) => {
    set({ operations: form.operations.filter((_, i) => i !== index) })
    setOpenIndex((current) => {
      if (current === index) return null
      if (current !== null && current > index) return current - 1
      return current
    })
  }

  return (
    <>
      <MetadataSection form={form} errors={errors} set={set} />

      <div className="d-flex justify-content-between align-items-center mt-4 mb-2">
        <h2 className="h5 mb-0">Operations</h2>
        <button type="button" className="btn btn-sm btn-outline-primary" onClick={addOperation}>
          + Add operation
        </button>
      </div>
      {errors['operations'] && <div className="text-danger small mb-2">{errors['operations']}</div>}

      <div className="accordion">
        {form.operations.map((operation, index) => (
          <OperationFields
            key={index}
            index={index}
            operation={operation}
            errors={errors}
            open={openIndex === index}
            onToggle={() => setOpenIndex((current) => (current === index ? null : index))}
            onChange={(op) => setOperation(index, op)}
            onRemove={form.operations.length > 1 ? () => removeOperation(index) : undefined}
          />
        ))}
      </div>
    </>
  )
}

/** Does this operation have any validation error (for the collapsed header)? */
function operationHasError(errors: ValidationErrors, index: number): boolean {
  return Object.keys(errors).some((key) => key === `op:${index}` || key.startsWith(`op:${index}:`))
}

// ---------------------------------------------------------------------------

interface MetadataSectionProps {
  form: ConfigForm
  errors: ValidationErrors
  set: (patch: Partial<ConfigForm>) => void
}

function MetadataSection({ form, errors, set }: MetadataSectionProps) {
  return (
    <div className="card">
      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">
              Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${errors['name'] ? 'is-invalid' : ''}`}
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="my-api"
            />
            {errors['name'] && <div className="invalid-feedback">{errors['name']}</div>}
          </div>
          <div className="col-md-3">
            <label className="form-label">Version</label>
            <input
              type="text"
              className="form-control"
              value={form.version}
              onChange={(e) => set({ version: e.target.value })}
              placeholder="1.0.0"
            />
          </div>
          <div className="col-12">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-control"
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Terms of service</label>
            <input
              type="text"
              className="form-control"
              value={form.termsOfService}
              onChange={(e) => set({ termsOfService: e.target.value })}
              placeholder="http://example.com/terms/"
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">Contact name</label>
            <input
              type="text"
              className="form-control"
              value={form.contactName}
              onChange={(e) => set({ contactName: e.target.value })}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Contact email</label>
            <input
              type="email"
              className="form-control"
              value={form.contactEmail}
              onChange={(e) => set({ contactEmail: e.target.value })}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Contact URL</label>
            <input
              type="text"
              className="form-control"
              value={form.contactUrl}
              onChange={(e) => set({ contactUrl: e.target.value })}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">License name</label>
            <input
              type="text"
              className="form-control"
              value={form.licenseName}
              onChange={(e) => set({ licenseName: e.target.value })}
              placeholder="Apache 2.0"
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">License URL</label>
            <input
              type="text"
              className="form-control"
              value={form.licenseUrl}
              onChange={(e) => set({ licenseUrl: e.target.value })}
            />
          </div>

          <div className="col-12">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="secured-switch"
                checked={form.secured}
                onChange={(e) => set({ secured: e.target.checked })}
              />
              <label className="form-check-label" htmlFor="secured-switch">
                Secured
              </label>
            </div>
          </div>
          {form.secured && (
            <div className="col-md-6">
              <label className="form-label">
                Auth config <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className={`form-control ${errors['authConfig'] ? 'is-invalid' : ''}`}
                value={form.authConfig}
                onChange={(e) => set({ authConfig: e.target.value })}
                placeholder="Expected Authorization header value"
              />
              {errors['authConfig'] && <div className="invalid-feedback">{errors['authConfig']}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

interface OperationFieldsProps {
  index: number
  operation: OperationForm
  errors: ValidationErrors
  open: boolean
  onToggle: () => void
  onChange: (operation: OperationForm) => void
  onRemove?: () => void
}

function OperationFields({ index, operation, errors, open, onToggle, onChange, onRemove }: OperationFieldsProps) {
  const collapseId = `op-collapse-${index}`
  const headingId = `op-heading-${index}`
  const invalid = operationHasError(errors, index)

  const setMethod = (methodIndex: number, method: MethodForm) => {
    const methods = operation.methods.slice()
    methods[methodIndex] = method
    onChange({ ...operation, methods })
  }

  const addMethod = () => onChange({ ...operation, methods: [...operation.methods, emptyMethod()] })

  const removeMethod = (methodIndex: number) =>
    onChange({ ...operation, methods: operation.methods.filter((_, i) => i !== methodIndex) })

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
            <span className="fw-semibold">{operation.name.trim() || `Operation ${index + 1}`}</span>
            {operation.methods.map((method, methodIndex) => (
              <MethodBadge key={methodIndex} method={method.method || '?'} />
            ))}
            {!open && invalid && (
              <span className="badge text-bg-danger">needs attention</span>
            )}
          </span>
        </button>
      </h3>
      <div
        id={collapseId}
        className={`accordion-collapse collapse ${open ? 'show' : ''}`}
        aria-labelledby={headingId}
      >
        <div className="accordion-body">
          <div className="row g-2 align-items-end mb-3">
            <div className="col">
              <label className="form-label">Operation name</label>
              <input
                type="text"
                className={`form-control ${errors[`op:${index}:name`] ? 'is-invalid' : ''}`}
                value={operation.name}
                onChange={(e) => onChange({ ...operation, name: e.target.value })}
                placeholder="GLOSSARY"
              />
              {errors[`op:${index}:name`] && (
                <div className="invalid-feedback">{errors[`op:${index}:name`]}</div>
              )}
            </div>
            {onRemove && (
              <div className="col-auto">
                <button type="button" className="btn btn-outline-danger" onClick={onRemove}>
                  Remove operation
                </button>
              </div>
            )}
          </div>

          {errors[`op:${index}:methods`] && (
            <div className="text-danger small mb-2">{errors[`op:${index}:methods`]}</div>
          )}

          {operation.methods.map((method, methodIndex) => (
            <MethodFields
              key={methodIndex}
              opIndex={index}
              methodIndex={methodIndex}
              method={method}
              errors={errors}
              onChange={(m) => setMethod(methodIndex, m)}
              onRemove={operation.methods.length > 1 ? () => removeMethod(methodIndex) : undefined}
            />
          ))}

          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={addMethod}>
            + Add method
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

interface MethodFieldsProps {
  opIndex: number
  methodIndex: number
  method: MethodForm
  errors: ValidationErrors
  onChange: (method: MethodForm) => void
  onRemove?: () => void
}

function MethodFields({ opIndex, methodIndex, method, errors, onChange, onRemove }: MethodFieldsProps) {
  const methodErr = errors[`op:${opIndex}:m:${methodIndex}:method`]
  const statusErr = errors[`op:${opIndex}:m:${methodIndex}:statusCode`]

  const setHeader = (headerIndex: number, header: HeaderRow) => {
    const headers = method.headers.slice()
    headers[headerIndex] = header
    onChange({ ...method, headers })
  }

  const addHeader = () => onChange({ ...method, headers: [...method.headers, { key: '', value: '' }] })

  const removeHeader = (headerIndex: number) =>
    onChange({ ...method, headers: method.headers.filter((_, i) => i !== headerIndex) })

  return (
    <div className="border rounded p-3 mb-3 bg-light">
      <div className="row g-2 align-items-end">
        <div className="col-md-3">
          <label className="form-label">Method</label>
          <select
            className={`form-select ${methodErr ? 'is-invalid' : ''}`}
            value={method.method}
            onChange={(e) => onChange({ ...method, method: e.target.value })}
          >
            {HTTP_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {methodErr && <div className="invalid-feedback">{methodErr}</div>}
        </div>
        <div className="col-md-3">
          <label className="form-label">Status code</label>
          <input
            type="number"
            className={`form-control ${statusErr ? 'is-invalid' : ''}`}
            value={method.statusCode}
            onChange={(e) => onChange({ ...method, statusCode: e.target.value })}
          />
          {statusErr && <div className="invalid-feedback">{statusErr}</div>}
        </div>
        {onRemove && (
          <div className="col-md-auto ms-auto">
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRemove}>
              Remove method
            </button>
          </div>
        )}
      </div>

      <div className="mt-3">
        <label className="form-label mb-1">Headers</label>
        {method.headers.map((header, headerIndex) => (
          <div className="row g-2 mb-2" key={headerIndex}>
            <div className="col-md-4">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="header name"
                value={header.key}
                onChange={(e) => setHeader(headerIndex, { ...header, key: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="value1, value2"
                value={header.value}
                onChange={(e) => setHeader(headerIndex, { ...header, value: e.target.value })}
              />
            </div>
            <div className="col-md-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-danger w-100"
                onClick={() => removeHeader(headerIndex)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={addHeader}>
          + Add header
        </button>
      </div>

      <div className="mt-3">
        <label className="form-label mb-1">Response body</label>
        <textarea
          className="form-control font-monospace small"
          rows={4}
          value={method.body}
          onChange={(e) => onChange({ ...method, body: e.target.value })}
          placeholder={'{\n  "key": "value"\n}'}
        />
      </div>
    </div>
  )
}
