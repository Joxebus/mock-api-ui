import { useCallback, useEffect, useRef, useState } from 'react'

export interface AsyncActionState<T> {
  data: T | null
  error: string | null
  running: boolean
}

/**
 * Run an async action on demand (e.g. from a button), tracking running/error/data.
 * Each run aborts the previous one; unmounting aborts the one in flight.
 * `action` should be stable (module-level function or memoized).
 */
export function useAsyncAction<A extends unknown[], T>(
  action: (signal: AbortSignal, ...args: A) => Promise<T>,
) {
  const [state, setState] = useState<AsyncActionState<T>>({ data: null, error: null, running: false })
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  const run = useCallback(
    async (...args: A) => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      setState((current) => ({ ...current, error: null, running: true }))
      try {
        const data = await action(controller.signal, ...args)
        if (!controller.signal.aborted) setState({ data, error: null, running: false })
      } catch (err) {
        if (!controller.signal.aborted) {
          const message = err instanceof Error ? err.message : 'Unexpected error'
          setState({ data: null, error: message, running: false })
        }
      }
    },
    [action],
  )

  /** Abort the call in flight, keeping the last result. */
  const cancel = useCallback(() => {
    if (!controllerRef.current) return
    controllerRef.current.abort()
    controllerRef.current = null
    setState((current) => ({ ...current, running: false }))
  }, [])

  return { ...state, run, cancel }
}
