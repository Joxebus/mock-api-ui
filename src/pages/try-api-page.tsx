import { useParams } from 'react-router-dom'
import { BackWithError } from '../components/error-view'
import { LoadingView } from '../components/loading-view'
import { getConfiguration, getEndpoint, TryApiView } from '../features/api-configs'
import { useAsync } from '../hooks'

export function TryApiPage() {
  const { apiName = '' } = useParams()

  const { data, loading, error } = useAsync(
    () => Promise.all([getConfiguration(apiName), getEndpoint(apiName)]),
    [apiName],
  )

  if (loading) return <LoadingView message={`Loading "${apiName}"…`} />
  if (error) return <BackWithError message={error} />
  if (!data) return <BackWithError message="No data available." />

  const [config, endpointConfig] = data
  return <TryApiView config={config} endpointConfig={endpointConfig} />
}
