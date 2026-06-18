# ── Stage 1: deps ────────────────────────────────────────────────────────────
FROM node:18-alpine AS deps

WORKDIR /app

# Copy only the manifest files first so Docker can cache this layer
COPY Backend/package*.json ./
RUN npm ci --omit=dev

# Copy Prisma schema and generate the client
COPY Backend/prisma ./prisma
RUN npx prisma generate

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:18-alpine AS runner

WORKDIR /app

# Non-root user for security
RUN addgroup -S tempus && adduser -S tempus -G tempus

# Copy installed modules + generated Prisma client from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy application source
COPY Backend/ .

# Ownership
RUN chown -R tempus:tempus /app
USER tempus

# The API listens on port 3000 (set via PORT env var, defaults to 3000)
EXPOSE 3000

# Environment — override DATABASE_URL, JWT_SECRET, etc. at runtime via --env-file or -e
ENV NODE_ENV=production

# Start the production server (not nodemon)
CMD ["node", "server.js"]
