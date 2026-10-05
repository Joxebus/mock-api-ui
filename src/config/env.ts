// Empty base => rely on the Vite dev proxy (same-origin). Set VITE_API_BASE_URL
// to e.g. "http://localhost:8080" to hit the backend directly (uses CORS).
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

// Backend address as seen from the user's machine, for URLs shown to the user (e.g.
// "Copy curl"). The app itself still calls API_BASE_URL. Defaults to :8080, which is
// where the backend runs in development and is published by docker-compose.
export const BACKEND_URL = (
  import.meta.env.VITE_BACKEND_URL || API_BASE_URL || 'http://localhost:8080'
).replace(/\/+$/, '')
