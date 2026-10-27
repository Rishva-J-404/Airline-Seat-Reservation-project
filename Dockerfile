# ============================================================
# Dockerfile - Airline DSA Frontend Service
# Multi-stage production build: Node.js build -> Nginx Alpine
# ============================================================

# Stage 1: Build static web assets
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install all build dependencies
RUN npm ci

# Copy full frontend source code
COPY . .

# Build production bundle with Vite
RUN npm run build

# Stage 2: Serve optimized static bundle via Nginx
FROM nginx:alpine AS runner

# Remove default nginx static html
RUN rm -rf /usr/share/nginx/html/*

# Copy build artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with SPA fallback and API proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
