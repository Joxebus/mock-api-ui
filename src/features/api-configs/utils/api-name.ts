/** Extract "{apiName}" from a config path like "/config/{apiName}". */
export function apiNameFromConfigPath(configPath: string): string {
  const parts = configPath.split('/').filter(Boolean)
  return parts[parts.length - 1] ?? ''
}
