FROM oven/bun:1.2 AS builder
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies (workspace-aware)
COPY package.json bun.lock ./
COPY core/package.json ./core/
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN bun install --frozen-lockfile

# Copy all source
COPY . .

# Build the React client
RUN cd client && bun run build

# Generate Prisma client for the Linux runtime
RUN cd server && bunx prisma generate

# ── Production image ──────────────────────────────────────────────────────────
FROM oven/bun:1.2
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/core ./core
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist

ENV NODE_ENV=production
EXPOSE 3001

WORKDIR /app/server
CMD ["sh", "-c", "bunx prisma migrate deploy && bun run src/index.ts"]
