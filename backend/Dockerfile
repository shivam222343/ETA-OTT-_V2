# ============================================
# ETA-OTT Backend — Production Dockerfile
# Multi-stage build for minimal image size
# ============================================

# ---------- Stage 1: Install dependencies ----------
FROM node:22-alpine AS deps

WORKDIR /app

# Copy package files first (layer caching)
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm install --omit=dev --legacy-peer-deps && \
    npm cache clean --force

# ---------- Stage 2: Production runtime ----------
FROM node:22-alpine AS runtime

# Security: run as non-root
RUN addgroup -S etaapp && adduser -S etaapp -G etaapp

WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY package.json ./
COPY server.js ./
COPY config/ ./config/
COPY middleware/ ./middleware/
COPY models/ ./models/
COPY routes/ ./routes/
COPY services/ ./services/

# Set ownership
RUN chown -R etaapp:etaapp /app

USER etaapp

# Environment defaults
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Health check against the /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["node", "server.js"]
