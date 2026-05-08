# Root Dockerfile for SKM Workshop System (Monolith)

# -------------------------
# 1. Build Stage
# -------------------------
FROM node:18-alpine AS builder

# OpenSSL is required by Prisma engines on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package configurations
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install all dependencies
RUN npm install --prefix backend
RUN npm install --prefix frontend

# Copy all source code
COPY . .

# Generate Prisma client and build React frontend
RUN npm run build

# -------------------------
# 2. Production Stage
# -------------------------
FROM node:18-alpine

# OpenSSL is required by Prisma engines at runtime
RUN apk add --no-cache openssl

WORKDIR /app

# Copy backend from builder
COPY --from=builder /app/backend ./backend
# Copy built frontend from builder
COPY --from=builder /app/frontend/dist ./frontend/dist

# Set environment variables
ENV NODE_ENV=production

# Start the server
WORKDIR /app/backend
CMD ["npm", "start"]
