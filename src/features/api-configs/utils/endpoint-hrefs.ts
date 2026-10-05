import type { EndpointConfiguration } from '../types/api-configuration'

/**
 * Map operation name -> mock href (/api/{apiName}/{operation}) from the endpoint
 * discovery view. Operation names may themselves contain "/".
 */
export function hrefByOperation(apiName: string, endpointConfig: EndpointConfiguration): Map<string, string> {
  const prefix = `/api/${apiName}/`
  const hrefs = new Map<string, string>()
  for (const endpoint of endpointConfig.endpoints) {
    const operationName = endpoint.href.startsWith(prefix)
      ? endpoint.href.slice(prefix.length)
      : (endpoint.href.split('/').filter(Boolean).pop() ?? '')
    hrefs.set(operationName, endpoint.href)
  }
  return hrefs
}
