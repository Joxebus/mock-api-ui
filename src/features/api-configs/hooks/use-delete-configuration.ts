import { useState } from 'react'
import { errorMessage } from '@/services'
import { deleteConfiguration } from '../api/api-configs-api'

export interface DeleteConfigurationState {
  /** Name of the API awaiting confirmation, or null when no dialog is open. */
  pending: string | null
  deleting: boolean
  error: string | null
  /** Open the confirmation for `apiName`. */
  requestDelete: (apiName: string) => void
  confirm: () => Promise<void>
  cancel: () => void
}

/**
 * Confirm-then-delete flow for a configuration. `onDeleted` runs after a
 * successful delete (e.g. reload the list or navigate away); on failure the
 * dialog stays open and shows the backend error.
 */
export function useDeleteConfiguration(
  onDeleted: (apiName: string) => void,
): DeleteConfigurationState {
  const [pending, setPending] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestDelete = (apiName: string) => {
    setError(null)
    setPending(apiName)
  }

  const cancel = () => setPending(null)

  const confirm = async () => {
    if (!pending) return
    setDeleting(true)
    setError(null)
    try {
      await deleteConfiguration(pending)
      setPending(null)
      setDeleting(false)
      onDeleted(pending)
    } catch (e) {
      setError(errorMessage(e, 'Failed to delete the configuration.'))
      setDeleting(false)
    }
  }

  return { pending, deleting, error, requestDelete, confirm, cancel }
}
