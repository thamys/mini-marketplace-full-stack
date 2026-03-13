# 00 — Diagnóstico: Estado Atual de QA e Testing

> Análise baseada em leitura direta do código. Hipóteses explicitamente marcadas.

---

## 1. Visão Geral do Sistema

### Arquitetura

Monorepo gerenciado com **pnpm workspaces**. Dois subprojetos: `frontend/` (Next.js 16.1.6 App Router) e `backend/` (NestJS 11.0.1).

### Frontend

**Grupos de rotas:**
- `(shop)/` — área pública/cliente: `/` (catálogo), `/login`, `/register`, `/products/[id]`, `/profile`, `/orders`
- `admin/` — área administrativa: `/admin` (dashboard), `/admin/products`, `/admin/orders`
- `api/auth/session` — Next.js route: gerencia cookie `auth_token` httpOnly (POST: setar, DELETE: limpar, GET: verificar)
- `api/proxy/[...path]` — BFF proxy: lê cookie httpOnly e adiciona JWT como `Authorization` header

**Camada de API (dois instances Axios):**
- `lib/api.ts` → `api`: direto ao backend (rotas públicas — GET products, login, register)
- `lib/api.ts` → `bffApi`: via proxy BFF (rotas autenticadas — POST/PUT/DELETE products, orders)

**Estado:**
- TanStack Query para server state (produtos, pedidos)
- `lib/auth-context.tsx` — React Context de autenticação
- `lib/cart-context.tsx` — carrinho com persistência em `sessionStorage`

**Autenticação no Frontend:**
- Middleware (`middleware.ts`) decodifica JWT via `jwt-decode` (sem verificar assinatura) para proteger rotas
- Redirecionamentos por role: CUSTOMER tentando `/admin` → `/`; ADMIN tentando `/` → `/admin`

### Backend

**Módulos NestJS:**
- `AuthModule` — register, login, JWT strategy (`passport-jwt`), guards
- `ProductsModule` — CRUD completo, paginação, busca por nome, filtro por categoria
- `OrdersModule` — criação atômica (Prisma `$transaction`), listagem por role, updateStatus
- `UsersModule` — repositório de usuário
- `PrismaModule` — ORM singleton

**Database:** PostgreSQL 15 via Prisma 6.19.2
- Modelos: `User`, `Product`, `Order`, `OrderItem`
- Enums: `Role` (CUSTOMER, ADMIN), `OrderStatus` (PENDING, COMPLETED, CANCELLED)
- 4 migrations aplicadas até `20260312165304_add_order_fields`

**Autenticação/Autorização:**
- `JwtAuthGuard` — valida JWT no header `Authorization: Bearer <token>`
- `RolesGuard` + `@Roles()` decorator — verifica role do usuário no payload JWT
- `ZodValidationPipe` — valida DTOs via schemas Zod, retorna 400 com erros por campo

---

## 2. Ferramentas de Teste Encontradas

| Ferramenta | Contexto | Versão | Status |
|---|---|---|---|
| Jest | Backend — testes unitários | ^30.0.0 | Instalado e configurado |
| ts-jest | Backend — transform TypeScript | ^29.2.5 | Instalado e configurado |
| Supertest | Backend — integração HTTP | ^7.0.0 | Instalado e configurado |
| @nestjs/testing | Backend — módulo de teste | ^11.0.1 | Instalado e configurado |
| @playwright/test | Frontend — E2E | ^1.58.2 | Instalado e configurado |
| Jest (frontend) | Frontend — unitários | — | **NÃO INSTALADO** |
| React Testing Library | Frontend — componentes | — | **NÃO INSTALADO** |
| Vitest | Alternativa ao Jest | — | **NÃO INSTALADO** |

---

## 3. Configuração Atual

### Backend Jest (`backend/package.json` inline)

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "collectCoverageFrom": ["**/*.(t|j)s"],
  "coverageDirectory": "../coverage",
  "testEnvironment": "node"
}
```

**Problemas:**
- Sem `setupFilesAfterFramework` — sem configuração global de mock ou ambiente
- Sem `globalSetup`/`globalTeardown`
- `collectCoverageFrom: ["**/*.(t|j)s"]` coleta de tudo, inclusive arquivos de módulo sem teste algum, distorcendo métricas

### Backend E2E (`backend/test/jest-e2e.json`)

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" }
}
```

**Problemas:**
- `testRegex: ".e2e-spec.ts$"` — sem `^` no início, tecnicamente poderia capturar arquivos em caminhos inesperados (baixo risco)
- Sem `globalSetup` para rodar migrations antes dos testes
- Usa a mesma `DATABASE_URL` dos unitários — sem isolamento de banco

### Playwright (`frontend/playwright.config.ts`)

```
baseURL: http://localhost:3000
timeout: 5000ms (expect), 60000ms (default nos testes)
workers: 1 (sequencial)
retries: 2
reporter: html
browsers: Chromium only
webServer: build + start Next.js
```

**Observações:**
- Workers: 1 é correto dado o estado compartilhado por mocks de rota
- Retries: 2 no CI é aceitável; pode mascarar flakiness estrutural
- Sem `globalSetup`/`globalTeardown` para fixtures

---

## 4. Inventário Completo de Testes

### Backend — Unitários (`src/**/*.spec.ts`)

| Arquivo | Linhas | Status | Cobertura |
|---|---|---|---|
| `app.controller.spec.ts` | 26 | Trivial | Apenas health check |
| `auth/auth.service.spec.ts` | 169 | Bom | register (sucesso, conflito), login (sucesso, email não encontrado, senha errada) |
| `products/products.service.spec.ts` | 210 | Bom | findAll (5 casos), findById (2 casos), create, update, delete |
| `products/products.controller.spec.ts` | 25 | **STUB** | Apenas `toBeDefined()` — sem valor real |
| `orders/orders.service.spec.ts` | 224 | Bom | create (6 casos: success, snapshot, productId inválido, estoque insuficiente, conflito parcial, findByUser) |
| `orders/orders.controller.spec.ts` | 153 | Razoável | create (sucesso, guard, estoque), findOrders (customer, admin) |
| `users/users.repository.spec.ts` | 101 | Básico | findUserById, createUser |

**Ausências nos unitários:**
- `ZodValidationPipe` — nenhum teste unitário
- `JwtAuthGuard` — nenhum teste unitário isolado
- `RolesGuard` — nenhum teste unitário isolado
- `orders.service` — `updateStatus()` sem cobertura
- `orders.service` — `findAll()` (admin) sem cobertura

### Backend — Integração/E2E (`test/*.e2e-spec.ts`)

| Arquivo | Linhas | Status | Cobertura |
|---|---|---|---|
| `app.e2e-spec.ts` | 26 | Trivial | Health check |
| `auth.e2e-spec.ts` | 151 | Bom | register (201, 409, 400), login (200, 401 senha errada, 401 não existe) |
| `products.e2e-spec.ts` | 172 | Bom | POST (201 admin, 400 validação, 403 customer), PUT (200), DELETE (204) |
| `rbac-errors.e2e-spec.ts` | 107 | Bom | JWT ausente/inválido/expirado (401), RBAC customer/admin |

**Ausências no E2E backend:**
- `GET /products` — sem teste de integração para listagem/filtros
- `POST /orders` — completamente ausente
- `GET /orders` — completamente ausente (ambos os roles)
- `PATCH /orders/:id/status` — completamente ausente
- `GET /auth/me` — só coberto via rbac-errors

### Frontend — E2E Playwright (`e2e/*.spec.ts`)

| Arquivo | Testes | Status | Cobertura |
|---|---|---|---|
| `auth.spec.ts` | 4 | Bom | Login sucesso/falha, proteção de rota, navegação login↔register |
| `register.spec.ts` | ? | Precisa validar | — |
| `catalog.spec.ts` | 3 | `test.describe.fixme` | **Marcado como fixme — não roda** |
| `product-details.spec.ts` | ? | Precisa validar | — |
| `orders.spec.ts` | 5 | Maioria `fixme` | TC-11.E2E.5 roda; TC-11.E2E.1-4 marcados como fixme |
| `admin-layout.spec.ts` | ? | Precisa validar | — |
| `rbac.spec.ts` | 5 | `test.describe.fixme` | **Marcado como fixme — não roda** |

**Impacto dos `fixme`:** Atualmente `catalog.spec.ts`, `rbac.spec.ts` e a maioria de `orders.spec.ts` estão marcados como `fixme`, o que significa que **a suite de E2E do frontend está significativamente reduzida**. Os testes mais críticos (fluxo de compra, RBAC) não estão sendo executados.

---

## 5. Problemas Identificados

### P0 — Bloqueadores ou Riscos Altos

1. **Testes críticos marcados como `fixme`**
   - `catalog.spec.ts` inteiro (`test.describe.fixme`)
   - `rbac.spec.ts` inteiro (`test.describe.fixme`)
   - `orders.spec.ts`: TC-11.E2E.1 a TC-11.E2E.4 como `test.fixme`
   - **Impacto**: Fluxo de compra completo, RBAC de rotas, e catálogo não estão sendo verificados em CI

2. **Hash bcrypt hardcoded inválido** em `auth.e2e-spec.ts:100`
   - `$2b$10$EPf9avv.WnJ7FmS6mHhO.uWx6lJmG2zQzFz0zFz0zFz0zFz0zFz0z` — parece fictício
   - **Hipótese**: TC-E2E-B04 (login com senha correta) pode estar falhando ou usando `upsert` que nunca chega a testar o login real

3. **Frontend sem tooling de testes unitários**
   - Zero testes de componentes, hooks, ou lógica de negócio client-side
   - Lógica crítica do `cart-context.tsx` completamente sem cobertura

4. **Orders: zero cobertura de integração no backend**
   - Nenhum `test/*.e2e-spec.ts` testa os endpoints de orders

### P1 — Problemas Estruturais

5. **`products.controller.spec.ts` é stub sem valor**
   - Único assert: `expect(controller).toBeDefined()` com `ProductsService: {}`
   - Conta positivamente nas métricas sem testar nada

6. **Dados de mock duplicados entre arquivos E2E**
   - `MOCK_JWT`, `MOCK_USER`, `MOCK_PRODUCT`, `MOCK_ORDER` redefinidos em cada spec
   - `setupAuthenticatedSession()` existe apenas em `orders.spec.ts` (hoje marcado como fixme)

7. **Ausência de contratos de API**
   - Nenhum mecanismo valida que o shape retornado pelo backend é o que o frontend espera
   - Uma mudança de campo silenciosa quebraria o frontend sem ser detectada nos testes

8. **BFF proxy e session route sem cobertura**
   - `app/api/proxy/[...path]/route.ts` — camada crítica entre frontend e backend, sem teste
   - `app/api/auth/session/route.ts` — base da autenticação frontend, sem teste

### P2 — Melhorias de Qualidade

9. **Console logs de debug ativos nos E2E**
   - `auth.spec.ts`: `page.on('request')` e `page.on('response')` poluem logs de CI

10. **Mocks JWT com assinatura `.signature` literal**
    - Funciona no middleware (usa `jwt-decode`, não verifica assinatura)
    - Falhariam se a verificação de assinatura fosse adicionada ao middleware

11. **`orderBy` e `include` em `updateStatus` não são testados**
    - O método existe e tem lógica de `findUnique` + `update`, mas nenhum spec cobre isso

---

## 6. Matriz de Cobertura Atual vs. Alvo

| Fluxo / Módulo | Cobertura Atual | Cobertura Alvo | Gap |
|---|---|---|---|
| Auth — service | Boa | Boa | Manter |
| Auth — E2E backend | Boa | Boa | Manter |
| Auth — E2E frontend | Parcial (login/register básico) | Completo + logout | Adicionar logout |
| Products — service | Boa | Boa | Manter |
| Products — controller | **Stub** | Real (guards, routing) | Reescrever |
| Products — E2E backend | Boa (CRUD + RBAC) | Boa | Manter |
| Products — E2E frontend | **fixme** | Catálogo + filtros + detalhe | Corrigir fixme + expandir |
| Orders — service | Boa | Boa + updateStatus + findAll | Expandir |
| Orders — controller | Razoável | Completo | Manter + revisão |
| Orders — E2E backend | **Ausente** | CRUD completo + updateStatus | Criar novo arquivo |
| Orders — E2E frontend | **fixme** (1 de 5 roda) | Fluxo completo | Corrigir fixme |
| RBAC frontend | **fixme** | Todas as rotas protegidas | Corrigir fixme |
| ZodValidationPipe | **Ausente** | Unitário isolado | Criar |
| Guards (isolados) | **Ausente** | Unitários | Criar |
| Cart context | **Ausente** | Unitário (Jest+RTL) | Instalar + criar |
| Auth context | **Ausente** | Unitário (Jest+RTL) | Instalar + criar |
| BFF proxy/session | **Ausente** | Integração (Next.js route handler) | Criar |
| Contratos de API | **Ausente** | Zod schema assertions | Criar |
| Admin — produtos E2E | Parcial (layout only) | CRUD completo | Criar |
| Admin — pedidos E2E | **Ausente** | Listagem + updateStatus | Criar |
