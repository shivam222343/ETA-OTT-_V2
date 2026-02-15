# ============================================
# ETA-OTT Frontend — Production Dockerfile
# Multi-stage: Vite build → Nginx serve
# ============================================
# syntax=docker/dockerfile:1

# ---------- Stage 1: Build the React app ----------
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files (layer caching)
COPY package.json package-lock.json ./

RUN npm install --legacy-peer-deps && npm cache clean --force

# Copy source code
COPY . .

# Copy the .env file for Vite build
# This file should be created before docker build with the VITE_* vars
# COPY .env.docker .env

RUN npm run build

# ---------- Stage 2: Serve with Nginx ----------
FROM nginx:alpine AS serve

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
