import { useMemo, useRef, useState } from 'react'
import { CodeTextarea, type LineMarker } from '@/components'
import { useDebouncedValue } from '@/hooks'
import type { ConfigForm } from '../../types/config-form'
import type { LintProblem } from '../../types/json-lint'
import { configToForm, formToConfig } from '../../utils/form-model'
import { lintConfigJson } from '../../utils/json-lint'
import { JsonLintPanel } from './json-lint-panel'

const LINT_DELAY_MS = 300

interface JsonTabProps {
  form: ConfigForm
  onChange: (form: ConfigForm) => void
}

/**
 * JSON view of the config. The form is the source of truth: whenever it changes
 * we re-render the JSON from it. Edits are linted as you type; "Apply to form"
 * syncs them back into the form model once the JSON is well-formed.
 */
export function JsonTab({ form, onChange }: JsonTabProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const derivedText = useMemo(() => JSON.stringify(formToConfig(form), null, 2), [form])
  const [text, setText] = useState(derivedText)

  // Re-sync the textarea when the form changes elsewhere (e.g. after "Apply to
  // form"). Adjusting state during render avoids an extra effect pass.
  const [syncedText, setSyncedText] = useState(derivedText)
  if (syncedText !== derivedText) {
    setSyncedText(derivedText)
    setText(derivedText)
  }

  const lintedText = useDebouncedValue(text, LINT_DELAY_MS)
  const lint = useMemo(() => lintConfigJson(lintedText), [lintedText])
  const pending = lintedText !== text
  const hasErrors = lint.problems.some((p) => p.severity === 'error')
  const unapplied = text !== derivedText

  // Color line numbers that have problems (errors win over warnings).
  const markers = useMemo(() => {
    const byLine = new Map<number, LineMarker>()
    if (pending) return byLine
    for (const problem of lint.problems) {
      const current = byLine.get(problem.line)
      if (!current) {
        byLine.set(problem.line, { severity: problem.severity, message: problem.message })
      } else {
        byLine.set(problem.line, {
          severity: current.severity === 'error' ? 'error' : problem.severity,
          message: `${current.message}\n${problem.message}`,
        })
      }
    }
    return byLine
  }, [lint, pending])

  const applyToForm = () => {
    // Lint the current text (not the debounced one) so a fast click can't
    // apply JSON that hasn't been checked.
    const { config } = lintConfigJson(text)
    if (config) onChange(configToForm(config))
  }

  const jumpTo = (problem: LintProblem) => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.focus()
    textarea.setSelectionRange(problem.offset, problem.offset)
    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 20
    textarea.scrollTop = Math.max(0, (problem.line - 3) * lineHeight)
  }

  return (
    <div>
      <p className="text-secondary small">
        This JSON is generated from the form. Edit it here — problems are listed below as you
        type — and click <strong>Apply to form</strong> to sync your changes back.
      </p>
      <CodeTextarea
        ref={textareaRef}
        value={text}
        onChange={setText}
        rows={20}
        invalid={!pending && hasErrors}
        markers={markers}
        ariaLabel="Configuration JSON"
      />
      <JsonLintPanel result={lint} pending={pending} onSelect={jumpTo} />
      <div className="d-flex align-items-center gap-2 mt-2">
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={applyToForm}
          disabled={!unapplied || (!pending && lint.config === null)}
        >
          Apply to form
        </button>
        {unapplied && (
          <span className="small text-warning-emphasis">
            Unapplied changes — saving uses the form, so apply them first.
          </span>
        )}
      </div>
    </div>
  )
}
