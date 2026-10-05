import { useParams } from 'react-router-dom'
import { BackWithError } from '../components/error-view'
import { LoadingView } from '../components/loading-view'
import { ConfigEditor, getConfiguration } from '../features/api-configs'
import { useAsync } from '../hooks'

export function ConfigEditorPage() {
  const { apiName } = useParams()
  const isEdit = apiName !== undefined

  // In edit mode, load the existing config first, then render the form seeded
  // from it. In create mode there is nothing to load.
  const { data, loading, error } = useAsync(
    () => (isEdit ? getConfiguration(apiName) : Promise.resolve(null)),
    [apiName],
  )

  if (loading) return <LoadingView message={`Loading "${apiName}"…`} />
  if (error) return <BackWithError message={error} />

  return <ConfigEditor isEdit={isEdit} initialConfig={data} />
}
