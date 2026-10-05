# ---- Build stage: produce the static SPA bundle ----
FROM node:24-alpine AS build
WORKDIR /app

# Install dependencies against the lockfile first (cached until it changes).
COPY package.json package-lock.json ./
RUN npm ci

# Build the production bundle. VITE_API_BASE_URL stays empty so the app uses
# relative paths, which nginx proxies to the backend (see nginx.conf).
# VITE_BACKEND_URL is only displayed to users (Copy curl): the backend as reachable
# from their machine. Override with --build-arg if it isn't published on :8080.
ARG VITE_BACKEND_URL=http://localhost:8080
COPY . .
RUN npm run build

# ---- Runtime stage: serve the bundle with nginx + reverse proxy ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
