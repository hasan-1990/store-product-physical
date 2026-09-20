# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy patch-package patches before install (postinstall needs them)
COPY patches ./patches

# Install all dependencies (including dev) for building, then clean cache
RUN npm ci && \
    npm cache clean --force

# Copy configuration files
COPY tsconfig.json ./
COPY next.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.mjs ./
COPY middleware.ts ./

# Copy source code directories explicitly
COPY src ./src
COPY public ./public
COPY data ./data

# Build-time public env (injected via docker-compose build args or CI)
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build Next.js app — runtime secrets come from container environment, not image layers
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built application from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the Next.js app
CMD ["node", "server.js"]
