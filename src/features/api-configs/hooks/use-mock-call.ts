import { useAsyncAction } from '@/hooks'
import { callMock } from '../api/mock-call-api'

/** On-demand mock call: `run(request)`, `cancel()`, plus `data` (last response), `error`, `running`. */
export function useMockCall() {
  return useAsyncAction(callMock)
}
