FROM node:20-alpine AS base
# Install pnpm globally for all stages
RUN npm install -g pnpm@8.15.8

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install all dependencies (including dev) for development
ENV NODE_ENV=development
RUN pnpm install --ignore-scripts

# Development stage
FROM base AS development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure nodemon is available in development stage
RUN npm install -g nodemon

# Expose port (will be set by environment variable in docker-compose)
EXPOSE 5001
CMD ["pnpm", "run", "dev"]

# Build stage
FROM base AS builder
WORKDIR /app

# Copy all source files
COPY . .

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Build the TypeScript application
ENV NODE_ENV=development
RUN pnpm run build

# Prune dev dependencies
RUN pnpm prune --prod

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy package files and install pnpm dependencies
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN pnpm install --prod --ignore-scripts

# Copy built app from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))" || exit 1

CMD ["pnpm", "start"]
