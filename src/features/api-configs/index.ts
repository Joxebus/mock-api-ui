// Public API of the api-configs feature. Code outside this folder must import
// from here, never from internal files (enforced by no-restricted-imports).
// Export only what other layers actually use; form model, validation and
// editor sub-components are intentionally private.
export { getConfiguration, getEndpoint, listEndpoints } from './api/api-configs-api'
export { ApiDetailView } from './components/api-detail-view'
export { ApiList } from './components/api-list'
export { ConfigEditor } from './components/config-editor/config-editor'
export { DeleteConfigurationModal } from './components/delete-configuration-modal'
export { useDeleteConfiguration } from './hooks/use-delete-configuration'
export type {
  ApiConfiguration,
  ApiContact,
  ApiLicense,
  ApiPath,
  Endpoint,
  EndpointConfiguration,
  EndpointOperation,
} from './types/api-configuration'
