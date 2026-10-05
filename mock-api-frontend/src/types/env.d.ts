interface ImportMetaEnv {
  /** Backend base URL. Empty/unset => use the Vite dev proxy. */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
