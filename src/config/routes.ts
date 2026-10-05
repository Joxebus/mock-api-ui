// Single source of truth for app URLs. Use the builders in <Link to> and
// navigate() instead of hard-coding paths.
export const ROUTE_PATTERNS = {
  home: '/',
  newApi: 'apis/new',
  apiDetail: 'apis/:apiName',
  editApi: 'apis/:apiName/edit',
  tryApi: 'apis/:apiName/try',
} as const

export const ROUTES = {
  home: '/',
  newApi: '/apis/new',
  apiDetail: (apiName: string) => `/apis/${encodeURIComponent(apiName)}`,
  editApi: (apiName: string) => `/apis/${encodeURIComponent(apiName)}/edit`,
  tryApi: (apiName: string) => `/apis/${encodeURIComponent(apiName)}/try`,
} as const
