# Production Dockerfile for Trajex Monorepo (Railway/Production)
FROM node:20-slim

WORKDIR /app

# Copy root manifest
COPY package.json package-lock.json ./

# Copy backend manifest and install dependencies
COPY backend/package.json backend/package-lock.json ./backend/
RUN npm run install:all

# Copy backend source code
COPY backend/src ./backend/src

# Set working directory to backend for execution
WORKDIR /app/backend

EXPOSE 3000

# Start the backend server
CMD ["npm", "start"]
