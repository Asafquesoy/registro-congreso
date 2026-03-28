# --- Stage 1: Build React ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install server dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Install client dependencies and build
COPY client/package.json client/package-lock.json ./client/
RUN cd client && npm ci

COPY client/ ./client/
RUN cd client && npm run build

# --- Stage 2: Production ---
FROM node:20-alpine

WORKDIR /app

# Copy server files
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server.js db.js ./
COPY images/ ./images/

# Copy React build from stage 1
COPY --from=builder /app/public_react ./public_react

# Create directory for database persistence
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]
