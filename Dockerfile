# ── Build stage ──
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund && npm cache clean --force

COPY . .
RUN npm run build && npm cache clean --force

# ── Runtime stage ──
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Create public dir (not in git — only .gitignored audio files exist there)
RUN mkdir -p /app/public/audio && chown -R nextjs:nodejs /app/public

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
