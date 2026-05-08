# Root Dockerfile for SKM Workshop System (Optimized for Railway)

# -------------------------
# 1. Frontend Build Stage
# -------------------------
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy only package files first (leverage Docker cache)
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --no-audit --no-fund

# Copy frontend source
COPY frontend/ ./

# Build the React app
RUN npm run build

# -------------------------
# 2. Backend Build Stage
# -------------------------
FROM node:18-alpine AS backend-builder

RUN apk add --no-cache openssl

WORKDIR /app/backend

# Copy only package files first (leverage Docker cache)
COPY backend/package*.json ./

# Install ALL dependencies (need devDeps for prisma generate)
RUN npm ci --no-audit --no-fund

# Copy prisma schema and generate client
COPY backend/prisma ./prisma/
RUN npx prisma generate

# Copy backend source code only
COPY backend/src ./src/

# Remove devDependencies to shrink node_modules
RUN npm prune --production

# -------------------------
# 3. Production Stage (minimal)
# -------------------------
FROM node:18-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Copy only production node_modules from backend builder
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules/

# Copy prisma generated client
COPY --from=backend-builder /app/backend/node_modules/.prisma ./backend/node_modules/.prisma/

# Copy backend source and prisma schema
COPY --from=backend-builder /app/backend/src ./backend/src/
COPY --from=backend-builder /app/backend/prisma ./backend/prisma/
COPY --from=backend-builder /app/backend/package*.json ./backend/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist/

# Copy root package.json for start script
COPY package*.json ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Start the server
CMD ["npm", "start"]
