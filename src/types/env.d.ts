interface ImportMetaEnv {
  /** Backend base URL. Empty/unset => use the Vite dev proxy. */
  readonly VITE_API_BASE_URL?: string
  /** Backend URL shown to users (Copy curl). Unset => VITE_API_BASE_URL or http://localhost:8080. */
  readonly VITE_BACKEND_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
