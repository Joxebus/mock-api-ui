import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError, createConfiguration, deleteConfiguration, getConfiguration } from '../api/client'
import { useAsync } from '../hooks/useAsync'
import { LoadingView } from '../components/StatusViews'
import ConfigFormFields from './editor/ConfigFormFields'
import JsonTab from './editor/JsonTab'
import { configToForm, emptyConfigForm, formToConfig, type ConfigForm } from './editor/formModel'
import { hasErrors, validateForm } from './editor/validation'

type Tab = 'form' | 'json'

export default function ConfigEditor() {
  const { apiName } = useParams()
  const isEdit = apiName !== undefined

  // In edit mode, load the existing config first, then render the form seeded
  // from it. In create mode there is nothing to load.
  const { data, loading, error } = useAsync(
    () => (isEdit ? getConfiguration(apiName) : Promise.resolve(null)),
    [apiName],
  )

  if (loading) return <LoadingView message={`Loading "${apiName}"…`} />
  if (error) {
    return (
      <div>
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <Link to="/" className="btn btn-outline-secondary btn-sm">
          ← Back to APIs
        </Link>
      </div>
    )
  }

  const initialForm = data ? configToForm(data) : emptyConfigForm()

  return <EditorForm isEdit={isEdit} initialForm={initialForm} />
}

interface EditorFormProps {
  isEdit: boolean
  initialForm: ConfigForm
}

function EditorForm({ isEdit, initialForm }: EditorFormProps) {
  const navigate = useNavigate()
  const [form, setForm] = useState<ConfigForm>(initialForm)
  const [tab, setTab] = useState<Tab>('form')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showErrors, setShowErrors] = useState(false)

  const errors = validateForm(form)
  const visibleErrors = showErrors ? errors : {}

  const handleSubmit = async () => {
    setShowErrors(true)
    setSubmitError(null)
    if (hasErrors(errors)) {
      setTab('form')
      return
    }

    setSubmitting(true)
    const newName = form.name.trim()
    const oldName = initialForm.name.trim()
    try {
      // Save first. In edit mode with a changed name this creates the config
      // under the new name; we only remove the old one after a successful save
      // so a validation failure can never orphan or delete data.
      await createConfiguration(formToConfig(form))

      if (isEdit && oldName && oldName !== newName) {
        try {
          await deleteConfiguration(oldName)
        } catch (e) {
          // The new config saved fine; only the cleanup of the old name failed.
          const detail = e instanceof ApiError ? e.message : 'unknown error'
          setSubmitError(
            `Saved as "${newName}", but the old configuration "${oldName}" could not be removed (${detail}). You may need to delete it manually.`,
          )
          setSubmitting(false)
          return
        }
      }

      navigate(`/apis/${encodeURIComponent(newName)}`)
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Failed to save the configuration.'
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const title = isEdit ? `Edit ${initialForm.name}` : 'Create API configuration'

  return (
    <div>
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">APIs</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {isEdit ? initialForm.name : 'New API'}
          </li>
        </ol>
      </nav>

      <h1 className="h3 mb-3">{title}</h1>

      {isEdit && (
        <div className="alert alert-info py-2" role="alert">
          Saving overwrites the existing configuration for <strong>{initialForm.name}</strong>.
          Changing the name renames it: the configuration is saved under the new name and the old
          one is removed.
        </div>
      )}

      {submitError && (
        <div className="alert alert-danger" role="alert">
          {submitError}
        </div>
      )}

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${tab === 'form' ? 'active' : ''}`}
            onClick={() => setTab('form')}
          >
            Form
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${tab === 'json' ? 'active' : ''}`}
            onClick={() => setTab('json')}
          >
            JSON
          </button>
        </li>
      </ul>

      {tab === 'form' ? (
        <ConfigFormFields form={form} errors={visibleErrors} onChange={setForm} />
      ) : (
        <JsonTab form={form} onChange={setForm} />
      )}

      <div className="d-flex gap-2 mt-4">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Saving…' : 'Save configuration'}
        </button>
        <Link to="/" className="btn btn-outline-secondary">
          Cancel
        </Link>
      </div>
    </div>
  )
}
