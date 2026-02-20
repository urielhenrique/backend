# Build stage
FROM node:20.19-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install all dependencies (including dev)
RUN npm ci

# Generate Prisma client
RUN npm run prisma:generate || npx prisma generate

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript to JavaScript
RUN npm run build 2>/dev/null || npx tsc

# Production stage
FROM node:20.19-alpine

WORKDIR /app

# Install dumb-init and curl for proper signal handling and health checks
RUN apk add --no-cache dumb-init curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy Prisma schema and generated client from builder
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Change ownership to nodejs user BEFORE creating script
RUN chown -R nodejs:nodejs /app

# Create migration script as root (before switching user)
RUN mkdir -p scripts && \
    echo '#!/bin/sh' > scripts/migrate.sh && \
    echo 'set -e' >> scripts/migrate.sh && \
    echo 'if [ -z "$DATABASE_URL" ]; then' >> scripts/migrate.sh && \
    echo '  echo "Error: DATABASE_URL not set"' >> scripts/migrate.sh && \
    echo '  exit 1' >> scripts/migrate.sh && \
    echo 'fi' >> scripts/migrate.sh && \
    echo 'echo "Running database migrations..."' >> scripts/migrate.sh && \
    echo 'npx prisma db push --accept-data-loss' >> scripts/migrate.sh && \
    chmod +x scripts/migrate.sh && \
    chown nodejs:nodejs scripts/migrate.sh

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application with migrations
CMD ["sh", "-c", "scripts/migrate.sh && node dist/server.js"]

