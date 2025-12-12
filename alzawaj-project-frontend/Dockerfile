FROM node:20-alpine AS base
# Install pnpm globally for all stages
RUN npm install -g pnpm@10.11.0

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN pnpm install --ignore-scripts

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN pnpm install --ignore-scripts
COPY . .

# Build application for production using webpack instead of Turbopack
ENV NODE_ENV=production
# Force Next.js to use webpack instead of Turbopack
ENV NEXT_PRIVATE_LOCAL_WEBPACK=1
ENV NEXT_USE_LOCAL_WEBPACK=1
RUN pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package files and install production dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile

# Copy the public folder
COPY --from=builder /app/public ./public

# Copy next.js build output (standalone and static)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://116.203.98.236:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))" || exit 1

CMD ["node", "server.js"]
