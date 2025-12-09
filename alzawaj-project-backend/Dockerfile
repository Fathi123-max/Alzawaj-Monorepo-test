FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install dependencies
# Install all dependencies (including dev) for building
RUN npm install --ignore-scripts --no-optional

# Build stage
FROM base AS builder
WORKDIR /app

# Copy all source files
COPY . .

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Build the TypeScript application
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Copy production dependencies and built app from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))" || exit 1

CMD ["npm", "start"]
