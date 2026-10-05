import { useNavigate, useParams } from 'react-router-dom'
import { BackWithError } from '../components/error-view'
import { LoadingView } from '../components/loading-view'
import { ROUTES } from '../config/routes'
import {
  ApiDetailView,
  DeleteConfigurationModal,
  getConfiguration,
  getEndpoint,
  useDeleteConfiguration,
} from '../features/api-configs'
import { useAsync } from '../hooks'

export function ApiDetailPage() {
  const { apiName = '' } = useParams()
  const navigate = useNavigate()

  const { data, loading, error } = useAsync(
    () => Promise.all([getConfiguration(apiName), getEndpoint(apiName)]),
    [apiName],
  )
  const deletion = useDeleteConfiguration(() => navigate(ROUTES.home))

  if (loading) return <LoadingView message={`Loading "${apiName}"…`} />
  if (error) return <BackWithError message={error} />
  if (!data) return <BackWithError message="No data available." />

  const [config, endpointConfig] = data

  return (
    <>
      <ApiDetailView
        config={config}
        endpointConfig={endpointConfig}
        onDelete={() => deletion.requestDelete(config.name)}
      />
      <DeleteConfigurationModal state={deletion} />
    </>
  )
}
