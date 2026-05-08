# Root Dockerfile for SKM Workshop System (Optimized for Railway)

# -------------------------
# 1. Frontend Build Stage
# -------------------------
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund

COPY frontend/ ./
RUN npm run build

# -------------------------
# 2. Backend Build Stage
# -------------------------
FROM node:18-alpine AS backend-builder

RUN apk add --no-cache openssl

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --no-audit --no-fund

COPY backend/prisma ./prisma/
RUN npx prisma generate

COPY backend/src ./src/

# Remove devDependencies to shrink node_modules
RUN npm prune --omit=dev

# -------------------------
# 3. Production Stage (minimal)
# -------------------------
FROM node:18-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Copy backend with production deps
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules/
COPY --from=backend-builder /app/backend/src ./backend/src/
COPY --from=backend-builder /app/backend/prisma ./backend/prisma/
COPY --from=backend-builder /app/backend/package.json ./backend/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist/

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Run directly with node - no npm overhead, no extra process
# This ensures proper signal handling and lower memory usage
CMD ["sh", "-c", "cd /app/backend && npx prisma migrate deploy && cd /app && exec node backend/src/server.js"]
