import { ConfirmModal } from '@/components'
import type { DeleteConfigurationState } from '../hooks/use-delete-configuration'

interface DeleteConfigurationModalProps {
  state: DeleteConfigurationState
}

/** Confirmation dialog wired to useDeleteConfiguration. */
export function DeleteConfigurationModal({ state }: DeleteConfigurationModalProps) {
  return (
    <ConfirmModal
      show={state.pending !== null}
      title="Delete configuration"
      confirmLabel="Delete"
      busy={state.deleting}
      error={state.error}
      onConfirm={state.confirm}
      onCancel={state.cancel}
    >
      <p className="mb-0">
        Delete the configuration <strong>{state.pending}</strong>? This removes its stored YAML and
        the mocked endpoints it serves. This action cannot be undone.
      </p>
    </ConfirmModal>
  )
}
