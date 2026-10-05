import { useMemo, useRef, type CSSProperties, type Ref } from 'react'
import './code-textarea.css'

export interface LineMarker {
  severity: 'error' | 'warning'
  /** Shown as a tooltip on the line number. */
  message: string
}

interface CodeTextareaProps {
  value: string
  onChange: (value: string) => void
  rows?: number
  invalid?: boolean
  /** Highlights for 1-based line numbers. */
  markers?: ReadonlyMap<number, LineMarker>
  ariaLabel?: string
  ref?: Ref<HTMLTextAreaElement>
}

/**
 * Monospace textarea with a line-number gutter. The gutter is a separate,
 * non-selectable element, so copying, pasting and typing only touch the text.
 * Lines with markers get a colored number and background.
 * Lines don't wrap, which keeps every number level with its line.
 */
export function CodeTextarea({
  value,
  onChange,
  rows = 20,
  invalid = false,
  markers,
  ariaLabel,
  ref,
}: CodeTextareaProps) {
  const gutterRef = useRef<HTMLDivElement>(null)
  const highlightsRef = useRef<HTMLDivElement>(null)
  const lineCount = useMemo(() => value.split('\n').length, [value])

  return (
    <div className={`form-control code-textarea ${invalid ? 'is-invalid' : ''}`}>
      <div ref={gutterRef} className="code-textarea__gutter" aria-hidden="true">
        {Array.from({ length: lineCount }, (_, i) => {
          const marker = markers?.get(i + 1)
          return (
            <div
              key={i}
              className={marker ? `code-textarea__line--${marker.severity}` : undefined}
              title={marker?.message}
            >
              {i + 1}
            </div>
          )
        })}
      </div>
      <div className="code-textarea__editor">
        {/* Line backgrounds sit behind the transparent textarea; scrolled via transform. */}
        <div className="code-textarea__highlights" aria-hidden="true">
          <div ref={highlightsRef}>
            {[...(markers ?? [])].map(([line, marker]) => (
              <div
                key={line}
                className={`code-textarea__band code-textarea__band--${marker.severity}`}
                style={{ '--line': line } as CSSProperties}
              />
            ))}
          </div>
        </div>
        <textarea
          ref={ref}
          className="code-textarea__input"
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={(e) => {
            const { scrollTop } = e.currentTarget
            if (gutterRef.current) gutterRef.current.scrollTop = scrollTop
            if (highlightsRef.current) highlightsRef.current.style.transform = `translateY(${-scrollTop}px)`
          }}
          wrap="off"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-label={ariaLabel}
        />
      </div>
    </div>
  )
}
