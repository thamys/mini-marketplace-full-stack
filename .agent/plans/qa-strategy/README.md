# QA & Testing Strategy — Mini Marketplace Full Stack

## Visão Geral

Este diretório contém o plano completo de QA/testing para o projeto Mini Marketplace Full Stack (pnpm monorepo: Next.js frontend + NestJS backend).

## Estrutura

```
qa-strategy/
├── README.md                    # Este arquivo — índice e resumo executivo
├── 00-system-analysis.md        # Diagnóstico completo do estado atual
├── phase-0-preparation.md       # Fase 0: Estabilização da base existente
├── phase-1-coverage.md          # Fase 1: Cobertura de lacunas críticas
├── phase-2-contracts.md         # Fase 2: Frontend unitário + contratos de API
├── phase-3-e2e-advanced.md      # Fase 3: E2E completo e cenários avançados
├── phase-4-pipeline.md          # Fase 4: Integração no pipeline CI/CD
└── backlog.md                   # Backlog de casos de teste priorizados
```

## Stack de Testes

| Camada | Ferramenta | Onde |
|---|---|---|
| Unitário backend | Jest + ts-jest | `backend/src/**/*.spec.ts` |
| Integração backend | Jest + Supertest + @nestjs/testing | `backend/test/*.e2e-spec.ts` |
| Unitário frontend | **A instalar**: Jest + RTL + jsdom | `frontend/**/*.spec.tsx` |
| E2E frontend | Playwright | `frontend/e2e/**/*.spec.ts` |
| Contrato | Zod schema assertions nos E2E backend | `backend/test/schemas/` |

## Resumo Executivo

### Situação Atual
- Backend: cobertura unitária boa em services, lacunas em pipe, controller de produtos (stub), e updateStatus de orders
- Backend E2E: boa cobertura de auth e products; ausente em orders (CRUD completo + updateStatus)
- Frontend: zero cobertura unitária (sem Jest/RTL instalados); E2E Playwright razoável mas com mocks duplicados, wait arbitrário e fluxos admin ausentes
- Contratos: nenhum mecanismo formal de validação de shape entre frontend e backend
- CI: pipeline único sem separação por camada/velocidade

### Prioridades Imediatas (Fase 0)
1. Corrigir hash bcrypt inválido em `auth.e2e-spec.ts`
2. Remover `waitForTimeout` arbitrário em `rbac.spec.ts` (já marcado como `fixme`)
3. Centralizar mocks duplicados do Playwright em `e2e/fixtures/`
4. Centralizar helpers de sessão em `e2e/helpers/auth.ts`
5. Reescrever `products.controller.spec.ts` (stub sem valor)

### Distribuição-Alvo de Testes
- 60–70% unitários (backend + frontend após Fase 2)
- 20–25% integração (backend E2E com Supertest)
- 5–10% E2E (Playwright — fluxos críticos de negócio)
- Contrato cobrindo todos os endpoints principais

## Contexto de Arquitetura

- **BFF Pattern**: Requisições autenticadas passam por `/api/proxy/[...path]` no Next.js (cookie httpOnly → JWT no header)
- **RBAC**: Dois roles — `CUSTOMER` e `ADMIN`. Middleware Next.js protege rotas client-side; Guards NestJS protegem endpoints
- **Domínios**: Auth, Products (CRUD), Orders (criação atômica com controle de estoque), Users
- **Banco**: PostgreSQL 15 via Prisma ORM — transações para criação de pedidos
- **CI**: GitHub Actions — lint → unit backend → E2E backend → E2E frontend (sequencial)
