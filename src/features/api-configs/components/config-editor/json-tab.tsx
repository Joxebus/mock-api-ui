import { useEffect, useState } from 'react'
import type { ApiConfiguration } from '../../types/api-configuration'
import type { ConfigForm } from '../../types/config-form'
import { configToForm, formToConfig } from '../../utils/form-model'

interface JsonTabProps {
  form: ConfigForm
  onChange: (form: ConfigForm) => void
}

/**
 * JSON view of the config. The form is the source of truth: whenever it changes
 * we re-render the JSON from it. Editing the JSON and clicking "Apply to form"
 * parses it and syncs back into the form model (if valid).
 */
export function JsonTab({ form, onChange }: JsonTabProps) {
  const derived = () => JSON.stringify(formToConfig(form), null, 2)
  const [text, setText] = useState(derived)
  const [error, setError] = useState<string | null>(null)

  // Re-sync the textarea when the form changes elsewhere (e.g. the Form tab).
  useEffect(() => {
    setText(JSON.stringify(formToConfig(form), null, 2))
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form])

  const applyToForm = () => {
    let parsed: ApiConfiguration
    try {
      parsed = JSON.parse(text) as ApiConfiguration
    } catch (e) {
      setError(e instanceof Error ? `Invalid JSON: ${e.message}` : 'Invalid JSON.')
      return
    }
    setError(null)
    onChange(configToForm(parsed))
  }

  return (
    <div>
      <p className="text-secondary small">
        This JSON is generated from the form. Edit it here and click{' '}
        <strong>Apply to form</strong> to sync your changes back.
      </p>
      <textarea
        className={`form-control font-monospace small ${error ? 'is-invalid' : ''}`}
        rows={20}
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
      />
      {error && <div className="invalid-feedback d-block">{error}</div>}
      <button type="button" className="btn btn-outline-secondary btn-sm mt-2" onClick={applyToForm}>
        Apply to form
      </button>
    </div>
  )
}
