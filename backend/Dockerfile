# Build backend
FROM node:18-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate

# Final image
FROM node:18-alpine
WORKDIR /app
COPY --from=backend-builder /app .
EXPOSE 5000
CMD ["npm", "start"]
