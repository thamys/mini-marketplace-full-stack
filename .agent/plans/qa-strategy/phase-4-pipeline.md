# Fase 4 — Integração no Pipeline CI/CD

## Objetivo

Reestruturar o pipeline de CI para refletir a estratégia em camadas definida nas fases anteriores. O pipeline atual é linear (lint → unit → E2E backend → E2E frontend) e não distingue velocidade, tipo de feedback ou custo de execução entre as etapas. O objetivo é torná-lo mais rápido em PRs, mais completo em merges para `main`, e preparar a base para execuções nightly/release.

**Duração estimada:** 1–2 dias
**Prioridade:** Média
**Pré-requisito:** Fases 0–3 concluídas (toda a nova suite existindo e passando localmente)
**Risco:** Baixo — apenas mudanças no CI, sem código de produção

---

## Contexto: Pipeline Atual

```yaml
# .github/workflows/ci.yml — situação atual
jobs:
  lint-backend       → lint + typecheck
  lint-frontend      → lint + typecheck
  test-backend       → (needs: lint-*) unit + E2E backend (juntos, com PostgreSQL)
  test-frontend-e2e  → (needs: test-backend) build + E2E Playwright
```

**Problemas do pipeline atual:**
1. `test-backend` roda unit tests e E2E juntos — unit tests rápidos ficam bloqueados aguardando banco de dados subir
2. `test-frontend-e2e` depende de `test-backend` inteiro — um falho de E2E de orders (lento) bloqueia o feedback de E2E do frontend
3. Sem cobertura de unit tests do frontend no CI (não existia até a Fase 2)
4. Sem separação de ambientes — unit tests e E2E do backend usam a mesma `DATABASE_URL`
5. Sem stage de nightly para testes mais caros

---

## Ação 4.1 — Separar jobs de unit e E2E no backend

**Arquivo:** `.github/workflows/ci.yml`

**Implementação:**

Dividir `test-backend` em dois jobs:

```yaml
test-backend-unit:
  name: Tests — Backend Unit
  runs-on: ubuntu-latest
  needs: [lint-backend, lint-frontend]
  # SEM serviço de PostgreSQL — unit tests não precisam de banco
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      with: { version: 10 }
    - uses: actions/setup-node@v4
      with: { node-version: 22, cache: pnpm }
    - run: pnpm install --frozen-lockfile
    - name: Run unit tests with coverage
      working-directory: backend
      run: pnpm test:cov
    - name: Upload coverage report
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: backend-unit-coverage
        path: backend/coverage/
        retention-days: 7

test-backend-e2e:
  name: Tests — Backend E2E
  runs-on: ubuntu-latest
  needs: [test-backend-unit]  # depende apenas dos unit tests passando
  services:
    postgres:
      image: postgres:15-alpine
      env:
        POSTGRES_USER: user
        POSTGRES_PASSWORD: pass
        POSTGRES_DB: marketplace_test  # banco separado para E2E
      ports: ['5432:5432']
      options: >-
        --health-cmd "pg_isready -U user -d marketplace_test"
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
  env:
    DATABASE_URL: postgresql://user:pass@localhost:5432/marketplace_test?schema=public
    JWT_SECRET: supersecretkey
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      with: { version: 10 }
    - uses: actions/setup-node@v4
      with: { node-version: 22, cache: pnpm }
    - run: pnpm install --frozen-lockfile
    - name: Run migrations
      working-directory: backend
      run: pnpm exec prisma migrate deploy
    - name: Run E2E tests
      working-directory: backend
      run: pnpm test:e2e
```

**Critérios de Aceite:**
- [ ] `test-backend-unit` roda sem serviço de PostgreSQL
- [ ] `test-backend-unit` completa em < 30s (unit tests rápidos)
- [ ] `test-backend-e2e` usa `marketplace_test` como banco dedicado (não o mesmo do ambiente dev)
- [ ] `DATABASE_URL` no job de E2E aponta para `marketplace_test`
- [ ] Upload de coverage artifact permanece no job de unit tests

---

## Ação 4.2 — Adicionar job de unit tests do frontend

**Arquivo:** `.github/workflows/ci.yml`

**Motivação:** Após a Fase 2, o frontend tem testes Jest. Eles devem rodar no CI em PRs, antes dos testes E2E Playwright (que são mais lentos).

**Implementação:**

```yaml
test-frontend-unit:
  name: Tests — Frontend Unit
  runs-on: ubuntu-latest
  needs: [lint-frontend]  # paralelo ao lint-backend — não precisa esperar backend
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      with: { version: 10 }
    - uses: actions/setup-node@v4
      with: { node-version: 22, cache: pnpm }
    - run: pnpm install --frozen-lockfile
    - name: Run frontend unit tests with coverage
      working-directory: frontend
      run: pnpm test:unit:cov
    - name: Upload frontend coverage
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: frontend-unit-coverage
        path: frontend/coverage-unit/
        retention-days: 7
```

Atualizar `test-frontend-e2e` para depender de `test-frontend-unit` e `test-backend-unit`:

```yaml
test-frontend-e2e:
  name: Tests — Frontend E2E
  runs-on: ubuntu-latest
  needs: [test-frontend-unit, test-backend-unit]  # não precisa esperar E2E do backend
```

**Critérios de Aceite:**
- [ ] Job `test-frontend-unit` criado e passando no CI
- [ ] Frontend unit tests rodam sem PostgreSQL
- [ ] `test-frontend-e2e` não mais depende de `test-backend` (agora dividido) — depende de `test-frontend-unit` e `test-backend-unit`
- [ ] Coverage do frontend aparece como artifact no CI

---

## Ação 4.3 — Ajustar ordem de dependências para feedback rápido em PRs

**Objetivo:** Feedback rápido de lint + unit (<2 min) deve estar disponível antes dos E2E (5–10 min).

**Grafo de dependências alvo:**

```
push/PR
├── lint-backend ──────────────────────────────────────┐
│                                                       │
├── lint-frontend ──────────────────────────────────── ├──► test-backend-unit ──► test-backend-e2e
│                                                       │
└── lint-frontend ──► test-frontend-unit ──────────────┘
                                          │
                                          └──► test-frontend-e2e
```

**Implementação do grafo:**
```yaml
# Dependências finais
lint-backend:       needs: []
lint-frontend:      needs: []
test-backend-unit:  needs: [lint-backend, lint-frontend]
test-backend-e2e:   needs: [test-backend-unit]
test-frontend-unit: needs: [lint-frontend]
test-frontend-e2e:  needs: [test-frontend-unit, test-backend-unit]
```

**Benefícios:**
- Lint + unit do frontend é independente do backend — faz sentido rodar em paralelo
- E2E do frontend não bloqueia no E2E do backend (que é mais lento por precisar de banco)
- Em PRs simples de frontend, apenas `lint-frontend` + `test-frontend-unit` são críticos

**Critérios de Aceite:**
- [ ] Grafo de dependências implementado conforme acima
- [ ] Um PR que toca apenas frontend aguarda: lint-frontend → test-frontend-unit → test-frontend-e2e
- [ ] Um PR que toca apenas backend aguarda: lint-backend + lint-frontend → test-backend-unit → test-backend-e2e
- [ ] Tempo total de CI em PR de frontend-only < 5 minutos

---

## Ação 4.4 — Criar workflow de nightly com testes avançados

**Arquivo a criar:** `.github/workflows/nightly.yml`

**Motivação:** Testes mais caros (E2E completo, smoke, concorrência) não devem bloquear PRs. Um workflow nightly valida o sistema em sua totalidade regularmente.

**Implementação:**

```yaml
name: Nightly Tests

on:
  schedule:
    - cron: '0 2 * * *'  # 02:00 UTC todo dia
  workflow_dispatch:  # permite execução manual

jobs:
  test-all-backend:
    name: Full Backend Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: user
          POSTGRES_PASSWORD: pass
          POSTGRES_DB: marketplace_nightly
        ports: ['5432:5432']
        options: >-
          --health-cmd "pg_isready -U user -d marketplace_nightly"
          --health-interval 10s --health-timeout 5s --health-retries 5
    env:
      DATABASE_URL: postgresql://user:pass@localhost:5432/marketplace_nightly?schema=public
      JWT_SECRET: supersecretkey
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - name: Migrations
        working-directory: backend
        run: pnpm exec prisma migrate deploy
      - name: Unit Tests
        working-directory: backend
        run: pnpm test:cov
      - name: E2E Tests (including concurrency)
        working-directory: backend
        run: pnpm test:e2e

  test-all-frontend:
    name: Full Frontend Tests
    runs-on: ubuntu-latest
    needs: [test-all-backend]
    env:
      NEXT_PUBLIC_API_URL: http://localhost:4000/api
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - name: Frontend Unit Tests
        working-directory: frontend
        run: pnpm test:unit:cov
      - name: Build
        working-directory: frontend
        run: pnpm build
      - name: Install Playwright Browsers (all)
        working-directory: frontend
        run: npx playwright install --with-deps  # todos os browsers no nightly
      - name: E2E Tests
        working-directory: frontend
        run: pnpm test:e2e
      - name: Upload Playwright Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-nightly-report
          path: frontend/playwright-report/
          retention-days: 30
```

**Critérios de Aceite:**
- [ ] Workflow `.github/workflows/nightly.yml` criado
- [ ] Roda às 02:00 UTC automaticamente
- [ ] Suporta `workflow_dispatch` para execução manual
- [ ] Usa banco separado `marketplace_nightly`
- [ ] Instala todos os browsers Playwright (Chromium + Firefox + WebKit) no nightly
- [ ] Artifact do relatório Playwright retido por 30 dias (vs 7 dias no CI de PR)
- [ ] `test-all-backend` inclui testes de concorrência (`orders-concurrency.e2e-spec.ts`)

---

## Ação 4.5 — Adicionar Playwright config para múltiplos browsers no nightly

**Arquivo:** `frontend/playwright.config.ts`

**Motivação:** O config atual usa apenas Chromium. O nightly deve testar em Firefox e WebKit também para detectar incompatibilidades de CSS ou APIs de browser.

**Implementação:**

```typescript
import { defineConfig, devices } from '@playwright/test';

const isNightly = process.env.CI_NIGHTLY === '1';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: { timeout: 5000 },
  workers: isNightly ? undefined : 1,  // paralelo no nightly, sequencial em PRs
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',

  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: isNightly
    ? [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
      ]
    : [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
      ],

  webServer: {
    command: 'pnpm build && pnpm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

No `nightly.yml`, adicionar `CI_NIGHTLY: '1'` como env no job de frontend.

**Critérios de Aceite:**
- [ ] Em PR/push normal: apenas Chromium, workers=1
- [ ] Em nightly (`CI_NIGHTLY=1`): Chromium + Firefox + WebKit
- [ ] `retries: 0` localmente, `retries: 2` em CI
- [ ] `trace: 'on-first-retry'` para facilitar diagnóstico de falhas no CI

---

## Ação 4.6 — Documentar scripts de execução local

**Arquivo a criar:** `.agent/plans/qa-strategy/local-testing-guide.md` (ou `TESTING.md` na raiz do projeto)

**Motivação:** Com múltiplas suites de teste, developers precisam de comandos claros para rodar o que precisam sem ter que navegar por `package.json` de cada subprojeto.

**Implementação:**

Scripts a documentar no `package.json` raiz ou como `Makefile`:

```json
// package.json raiz — scripts adicionados
{
  "scripts": {
    "test:unit": "pnpm --filter backend test && pnpm --filter frontend test:unit",
    "test:e2e:backend": "pnpm --filter backend test:e2e",
    "test:e2e:frontend": "pnpm --filter frontend test:e2e",
    "test:all": "pnpm test:unit && pnpm test:e2e:backend && pnpm test:e2e:frontend",
    "test:cov": "pnpm --filter backend test:cov && pnpm --filter frontend test:unit:cov"
  }
}
```

**Critérios de Aceite:**
- [ ] Scripts `test:unit`, `test:e2e:backend`, `test:e2e:frontend`, `test:all` disponíveis na raiz
- [ ] `pnpm test:unit` da raiz roda unit tests de backend e frontend sequencialmente
- [ ] Documentação em `TESTING.md` ou no README explica o que cada script faz

---

## Validação Final da Fase 4

**Checklist de CI:**

```bash
# Simular um PR de frontend
git checkout -b test/phase-4-validation
# Modificar um arquivo de componente qualquer
# Push e verificar que o pipeline executa corretamente

# Verificar grafo de execução no GitHub Actions:
# ✓ lint-frontend → test-frontend-unit → test-frontend-e2e
# ✓ lint-backend → test-backend-unit → test-backend-e2e
# ✓ test-frontend-e2e não aguarda test-backend-e2e

# Verificar tempo de CI:
# Unit tests backend: < 30s
# Unit tests frontend: < 45s
# E2E backend: < 3 min
# E2E frontend: < 5 min
# Total em PR: < 8 min
```

**Critério de saída da Fase 4:**
- [ ] Pipeline separado em 5 jobs: lint-backend, lint-frontend, test-backend-unit, test-backend-e2e, test-frontend-unit, test-frontend-e2e
- [ ] Jobs de unit não dependem de PostgreSQL
- [ ] Jobs de E2E backend usam banco `marketplace_test` isolado
- [ ] `nightly.yml` criado com testes completos + multi-browser
- [ ] Scripts `test:unit` e `test:all` disponíveis na raiz do monorepo
- [ ] Tempo de CI em PR < 8 minutos end-to-end
- [ ] Relatório de cobertura (backend + frontend) disponível como artifact em cada run

---

## Critérios de Qualidade e Gates (Referência Rápida)

### Em PRs
| Gate | Obrigatório | Detalhe |
|---|---|---|
| lint + typecheck (ambos) | Sim | Falha bloqueia todos os demais jobs |
| Backend unit tests | Sim | Todos os `.spec.ts` |
| Frontend unit tests | Sim | Jest + RTL (após Fase 2) |
| Backend E2E | Sim | auth, products, orders, rbac |
| Frontend E2E | Sim | Playwright Chromium |
| Smoke tests | Não | Apenas nightly |
| Multi-browser | Não | Apenas nightly |

### Em Merge/Main
Idêntico a PRs. O pipeline de `push: branches: [main]` roda o mesmo fluxo.

### Em Nightly
| Gate | Detalhe |
|---|---|
| Tudo do PR/main | + |
| Multi-browser E2E | Chromium + Firefox + WebKit |
| Concorrência de estoque | `orders-concurrency.e2e-spec.ts` |
| Smoke (se configurado) | `RUN_SMOKE_TESTS=1` |

### Sinais de Teste Ruim
- `expect(x).toBeDefined()` como único assertion
- `waitForTimeout(N)` sem comentário justificando
- Mock de módulo inteiro onde apenas 1 função é necessária
- Testes que dependem de ordem de execução entre arquivos

### Sinais de Flakiness
- Retries sendo consumidos com frequência (> 5% dos runs)
- Teste passa localmente mas falha em CI consistentemente
- `networkidle` como `waitUntil` em testes de UI com animações
