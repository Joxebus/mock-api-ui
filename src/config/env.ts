// Empty base => rely on the Vite dev proxy (same-origin). Set VITE_API_BASE_URL
// to e.g. "http://localhost:8080" to hit the backend directly (uses CORS).
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
