import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/config/routes'
import { errorMessage } from '@/services'
import { createConfiguration, deleteConfiguration } from '../../api/api-configs-api'
import type { ApiConfiguration } from '../../types/api-configuration'
import type { ConfigForm } from '../../types/config-form'
import { configToForm, emptyConfigForm, formToConfig } from '../../utils/form-model'
import { hasErrors, validateForm } from '../../utils/validation'
import { ConfigFormFields } from './config-form-fields'
import { JsonTab } from './json-tab'

type Tab = 'form' | 'json'

interface ConfigEditorProps {
  isEdit: boolean
  /** Existing configuration to edit; null when creating a new one. */
  initialConfig: ApiConfiguration | null
}

/** Create/edit form for a configuration, with Form and JSON tabs. */
export function ConfigEditor({ isEdit, initialConfig }: ConfigEditorProps) {
  const navigate = useNavigate()
  // Snapshot of the loaded config; also used to detect renames on save.
  const [initialForm] = useState(() =>
    initialConfig ? configToForm(initialConfig) : emptyConfigForm(),
  )
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
          const detail = errorMessage(e, 'unknown error')
          setSubmitError(
            `Saved as "${newName}", but the old configuration "${oldName}" could not be removed (${detail}). You may need to delete it manually.`,
          )
          setSubmitting(false)
          return
        }
      }

      navigate(ROUTES.apiDetail(newName))
    } catch (e) {
      setSubmitError(errorMessage(e, 'Failed to save the configuration.'))
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
            <Link to={ROUTES.home}>APIs</Link>
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
        <Link to={ROUTES.home} className="btn btn-outline-secondary">
          Cancel
        </Link>
      </div>
    </div>
  )
}
