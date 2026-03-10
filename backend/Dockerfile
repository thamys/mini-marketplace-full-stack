FROM node:22-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

COPY backend/package.json ./backend/
# Frontend package is needed for workspace lockfile resolution if we copy the root lockfile
COPY frontend/package.json ./frontend/

RUN pnpm install --frozen-lockfile

COPY backend/ ./backend/

WORKDIR /app/backend
# Generate Prisma client before building
RUN pnpm --filter backend exec prisma generate
RUN pnpm run build

FROM node:22-alpine AS runner
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY backend/package.json ./backend/

RUN pnpm install --prod --frozen-lockfile --filter backend

COPY backend/prisma ./backend/prisma
# Generate schema in production image too
RUN npm install -g prisma@^6.0.0
RUN prisma generate --schema=backend/prisma/schema.prisma

# Copy built application
COPY --from=builder /app/backend/dist ./backend/dist

# Entrypoint setup
EXPOSE 4000
CMD prisma migrate deploy && prisma db seed && node backend/dist/main.js
