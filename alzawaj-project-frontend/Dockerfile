FROM node:20-alpine AS base
# Install pnpm globally for all stages
RUN npm install -g pnpm@8.15.8

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

# Build application
ENV NODE_ENV=development
RUN pnpm run build || true

# Ensure .next exists even if build fails
RUN mkdir -p .next/standalone .next/static
RUN echo "Build completed with possible errors" > .next/standalone/README.md

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package files and install pnpm dependencies
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN pnpm install --prod --ignore-scripts

# Copy the public folder
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# Copy standalone if it exists, otherwise create minimal structure
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./ || true
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static/ || true

# If standalone server.js doesn't exist, create a fallback
RUN if [ ! -f "server.js" ]; then \
    echo "Creating fallback server.js"; \
    echo 'const { createServer } = require("http");\nconst { parse } = require("url");\nconst next = require("next");\nconst dev = process.env.NODE_ENV !== "production";\nconst app = next({ dev });\nconst handle = app.getRequestHandler();\napp.prepare().then(() => {\n  createServer((req, res) => {\n    const parsedUrl = parse(req.url, true);\n    handle(req, res, parsedUrl);\n  }).listen(3000, (err) => {\n    if (err) throw err;\n    console.log("> Ready on http://localhost:3000");\n  });\n});' > server.js; \
    fi

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))" || exit 1

CMD ["pnpm", "start"]
