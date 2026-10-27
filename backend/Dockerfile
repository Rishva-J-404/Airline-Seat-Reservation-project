# ============================================================
# Dockerfile - Airline DSA Backend Service
# Lightweight Alpine Node.js runtime for production Express API
# ============================================================

FROM node:20-alpine AS runner

WORKDIR /app

# Install security and network tools for container health checking
RUN apk add --no-cache curl

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source code and schema resources
COPY src/ ./src/

# Configuration defaults
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Health check to verify API responsiveness
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "src/server.js"]
