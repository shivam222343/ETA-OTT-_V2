# ============================================
# ETA-OTT Frontend — Production Dockerfile
# Multi-stage: Vite build → Nginx serve
# ============================================
# syntax=docker/dockerfile:1

# ---------- Stage 1: Build the React app ----------

    # ---------- Stage 1: Build the React app ----------
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps && npm cache clean --force

COPY . .

# 👇 ADD THESE LINES 👇
ARG VITE_API_URL
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID
# 👆 END ADD 👆

RUN npm run build

# FROM node:22-alpine AS build

# WORKDIR /app

# # Copy package files (layer caching)
# COPY package.json package-lock.json ./

# RUN npm install --legacy-peer-deps && npm cache clean --force

# Copy source code
# COPY . .

# Copy the .env file for Vite build
# This file should be created before docker build with the VITE_* vars
# COPY .env.docker .env

# RUN npm run build

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
