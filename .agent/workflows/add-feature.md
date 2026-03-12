---
description: Structured guide for adding a new end-to-end feature.
---

# Add New Feature Workflow

Follow this sequence to ensure consistent feature implementation across the monorepo.

## 📋 Development Sequence

### 1. Backend Foundation

- Update Prisma schema if needed and run migration (`database_operations` skill).
- Create/Update DTOs (English logic, Zod/Class-validator).
- Implement Repository/Service logic + Unit Tests.
- Implement Controller + **E2E Tests** (Mandatory).

### 2. Frontend Implementation

- Define API client methods.
- Create UI components using `shadcn/ui` (Portuguese user-facing text).
- Implement page logic using TanStack Query.
- Add **Playwright E2E Tests** (Mandatory).

### 3. Verification

- Run all tests: `pnpm test` & `pnpm test:e2e`.
- Check linting: `pnpm lint`.

## 📋 Quality Checklist

- [ ] Internal logic is in English?
- [ ] User-facing text is in Portuguese?
- [ ] Critical configs use `getOrThrow`?
- [ ] No `any` types used?
- [ ] E2E tests cover success and failure?
