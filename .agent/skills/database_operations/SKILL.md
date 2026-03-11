---
name: Database Operations
description: Procedures for managing the database schema with Prisma, migrations, and data seeding in the monorepo.
---

# Database Operations Skill

This skill provides the steps necessary to maintain and update the database layer.

## 📋 Prisma Workflow

### 1. Create a Migration

After modifying `backend/prisma/schema.prisma`, generate a new migration:

```bash
pnpm --filter backend exec prisma migrate dev --name <migration_name>
```

### 2. Apply Migrations (Production/CI)

```bash
pnpm --filter backend exec prisma migrate deploy
```

### 3. Generate Prisma Client

```bash
pnpm --filter backend exec prisma generate
```

## 📋 Data Management

### 1. Seed the Database

```bash
pnpm --filter backend run seed
```

### 2. Reset Database (Caution!)

```bash
pnpm --filter backend exec prisma migrate reset
```

## 📋 Troubleshooting

- **Connection Issues**: Ensure the database container is running: `docker compose ps`.
- **Schema Mismatch**: Run `prisma generate` to sync the client with the latest schema.
- **Docker Logs**: `docker compose logs db`.
