# Fase 0 — Diagnóstico e Preparação

## Objetivo

Estabilizar a base de testes existente antes de adicionar cobertura nova. Corrigir bugs conhecidos nos testes, eliminar flakiness estrutural, centralizar dados de mock e remover código sem valor. Esta fase não adiciona novos casos de teste de negócio — apenas garante que o que já existe é confiável.

**Duração estimada:** 1–2 dias
**Prioridade:** Crítica — deve ser concluída antes de qualquer outra fase
**Risco:** Baixo — mudanças cirúrgicas sem impacto em comportamento

---

## Contexto e Motivação

A análise do código identificou os seguintes problemas que comprometem a confiabilidade atual da suite:

1. **`catalog.spec.ts` e `rbac.spec.ts` estão marcados como `test.describe.fixme`** — os testes não rodam em CI. Fluxos críticos de RBAC e catálogo estão sem cobertura ativa.
2. **`orders.spec.ts`**: TC-11.E2E.1 a TC-11.E2E.4 estão como `test.fixme` — o fluxo completo de compra não está sendo verificado.
3. **Hash bcrypt hardcoded** em `auth.e2e-spec.ts:100` parece inválido — o TC-E2E-B04 pode estar falhando silenciosamente.
4. **`products.controller.spec.ts`** é um stub que não testa nada mas conta nas métricas de cobertura.
5. **Dados de mock duplicados** entre arquivos E2E do frontend aumentam custo de manutenção.
6. **Console logs de debug** ativos em `auth.spec.ts` poluem o output de CI.

---

## Ações

### Ação 0.1 — Investigar e corrigir o hash bcrypt em `auth.e2e-spec.ts`

**Arquivo:** `backend/test/auth.e2e-spec.ts`
**Linha:** 100

**Problema:**
```typescript
passwordHash: '$2b$10$EPf9avv.WnJ7FmS6mHhO.uWx6lJmG2zQzFz0zFz0zFz0zFz0zFz0z',
```
Este hash parece fictício. O teste TC-E2E-B04 faz upsert deste usuário e depois tenta login com `password123`. Se o hash não corresponder, o `bcrypt.compare` retornará `false` e o login retornará 401 em vez de 200.

**Implementação:**
1. Gerar o hash correto executando localmente:
   ```bash
   cd backend && node -e "const bcrypt = require('bcrypt'); bcrypt.hash('password123', 10).then(h => console.log(h))"
   ```
2. Substituir o hash hardcoded pelo valor gerado.
3. Alternativa mais robusta: no `beforeAll` do describe de login, criar o usuário via `prisma.user.create` usando `AuthService.register()` ou chamando `bcrypt.hash()` diretamente no setup:
   ```typescript
   import * as bcrypt from 'bcrypt';
   // ...
   beforeAll(async () => {
     const hash = await bcrypt.hash('password123', 10);
     await prisma.user.upsert({
       where: { email: 'e2e@test.com' },
       update: {},
       create: { name: 'E2E User', email: 'e2e@test.com', passwordHash: hash },
     });
   });
   ```

**Critérios de Aceite:**
- [ ] TC-E2E-B04 passa consistentemente com `expect(200)` ao enviar `{ email: 'e2e@test.com', password: 'password123' }`
- [ ] O hash no arquivo não é mais um valor fictício/hardcoded — é gerado dinamicamente ou é um valor verificado e documentado
- [ ] `pnpm test:e2e` no backend passa sem falhas em `auth.e2e-spec.ts`

---

### Ação 0.2 — Investigar e corrigir os `fixme` nos testes E2E do frontend

**Arquivos:**
- `frontend/e2e/catalog.spec.ts` — `test.describe.fixme`
- `frontend/e2e/rbac.spec.ts` — `test.describe.fixme`
- `frontend/e2e/orders.spec.ts` — TC-11.E2E.1 a TC-11.E2E.4 como `test.fixme`

**Problema:** Os fixmes indicam que estes testes estavam falhando e foram silenciados. Antes de remover os fixmes, é necessário entender a causa raiz da falha.

**Implementação:**
1. Remover os `fixme` temporariamente em ambiente local (não commitar ainda)
2. Executar `pnpm --filter frontend test:e2e` e capturar os erros reais
3. Para cada falha, categorizar:
   - **Seletor desatualizado** (ex: `data-testid` renomeado) → atualizar o seletor
   - **Comportamento de UI mudou** (ex: texto do toast diferente) → atualizar a assertion
   - **Mock de rota incompleto** (ex: nova rota sendo chamada sem mock) → adicionar mock
   - **Timeout insuficiente** (ex: animação lenta) → aumentar timeout local, não arbitrário
   - **Lógica do teste fundamentalmente errada** → reescrever o caso
4. Após corrigir cada falha, remover o `fixme` correspondente
5. Executar a suite completa para confirmar que todos passam com `retries: 0` localmente

**Critérios de Aceite:**
- [ ] `catalog.spec.ts`: todos os 3 testes passam sem `fixme` (TC-08.5.1, TC-08.5.3, TC-08.6.1)
- [ ] `rbac.spec.ts`: todos os 5 testes passam sem `fixme` (TC-07.1 a TC-07.5)
- [ ] `orders.spec.ts`: TC-11.E2E.1 a TC-11.E2E.4 passam sem `fixme`
- [ ] `pnpm --filter frontend test:e2e` passa com 0 falhas e 0 fixmes ativos em testes críticos
- [ ] Nenhum `waitForTimeout` arbitrário foi adicionado para fazer os testes passarem

---

### Ação 0.3 — Centralizar fixtures de mock do Playwright

**Arquivo a criar:** `frontend/e2e/fixtures/index.ts`
**Arquivos impactados:** todos os `*.spec.ts` em `frontend/e2e/`

**Problema:** `MOCK_JWT`, `MOCK_USER`, `MOCK_PRODUCT`, `MOCK_ORDER` são redefinidos em cada arquivo de spec. Qualquer mudança de contrato (ex: campo `role` → `userRole`) exige atualização manual em múltiplos arquivos.

**Implementação:**

Criar `frontend/e2e/fixtures/index.ts`:
```typescript
// Tokens JWT válidos para jwt-decode (payload real, assinatura mock)
export const MOCK_JWT_CUSTOMER =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  btoa(JSON.stringify({ sub: 'user-1', email: 'user@marketplace.com', name: 'Usuario Teste', role: 'CUSTOMER' })).replace(/=/g, '') +
  '.signature';

export const MOCK_JWT_ADMIN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  btoa(JSON.stringify({ sub: 'admin-1', email: 'admin@marketplace.com', name: 'Admin', role: 'ADMIN' })).replace(/=/g, '') +
  '.signature';

export const MOCK_USER_CUSTOMER = {
  id: 'user-1',
  email: 'user@marketplace.com',
  name: 'Usuario Teste',
  role: 'CUSTOMER' as const,
};

export const MOCK_USER_ADMIN = {
  id: 'admin-1',
  email: 'admin@marketplace.com',
  name: 'Admin',
  role: 'ADMIN' as const,
};

export const MOCK_PRODUCT_1 = {
  id: 'prod-1',
  name: 'Notebook Dell',
  description: 'Um ótimo notebook',
  price: '2500.00',
  category: 'eletronicos',
  stock: 5,
  imageUrl: null as null,
  createdAt: new Date().toISOString(),
};

export const MOCK_PRODUCT_2 = {
  id: 'prod-2',
  name: 'Mouse Logitech',
  description: 'Mouse sem fio',
  price: '150.00',
  category: 'perifericos',
  stock: 10,
  imageUrl: null as null,
  createdAt: new Date().toISOString(),
};

export const MOCK_PRODUCT_OUT_OF_STOCK = {
  ...MOCK_PRODUCT_1,
  id: 'prod-oos',
  name: 'Produto Esgotado',
  stock: 0,
};

export const MOCK_ORDER = {
  id: 'order-abc123de',
  userId: MOCK_USER_CUSTOMER.id,
  total: '2650.00',
  status: 'PENDING' as const,
  createdAt: new Date().toISOString(),
  items: [
    {
      id: 'item-1',
      orderId: 'order-abc123de',
      productId: MOCK_PRODUCT_1.id,
      productName: MOCK_PRODUCT_1.name,
      quantity: 1,
      unitPrice: MOCK_PRODUCT_1.price,
    },
    {
      id: 'item-2',
      orderId: 'order-abc123de',
      productId: MOCK_PRODUCT_2.id,
      productName: MOCK_PRODUCT_2.name,
      quantity: 1,
      unitPrice: MOCK_PRODUCT_2.price,
    },
  ],
};

export const MOCK_PAGINATED_PRODUCTS = {
  data: [MOCK_PRODUCT_1, MOCK_PRODUCT_2],
  meta: { total: 2, page: 1, limit: 12, totalPages: 1 },
};

export const MOCK_EMPTY_PRODUCTS = {
  data: [],
  meta: { total: 0, page: 1, limit: 12, totalPages: 0 },
};
```

Atualizar cada spec para importar de fixtures ao invés de redefinir localmente.

**Critérios de Aceite:**
- [ ] Arquivo `frontend/e2e/fixtures/index.ts` criado com todos os mocks tipados
- [ ] Nenhum arquivo de spec define `MOCK_USER`, `MOCK_JWT`, `MOCK_PRODUCT` ou `MOCK_ORDER` localmente — todos importam de `fixtures/index.ts`
- [ ] A suite de E2E passa sem regressão após a refatoração
- [ ] Tipos TypeScript corretos (sem `any` nas fixtures)

---

### Ação 0.4 — Centralizar helpers de sessão do Playwright

**Arquivo a criar:** `frontend/e2e/helpers/auth.ts`
**Arquivos impactados:** `orders.spec.ts` e todos os specs que precisarão de sessão autenticada

**Problema:** `setupAuthenticatedSession()` existe atualmente dentro de `orders.spec.ts` (que está com `test.fixme`). Outros specs reimplementam a lógica de injeção de cookie + mock de session de forma inline e inconsistente.

**Implementação:**

Criar `frontend/e2e/helpers/auth.ts`:
```typescript
import type { Page } from '@playwright/test';
import {
  MOCK_JWT_CUSTOMER,
  MOCK_JWT_ADMIN,
  MOCK_USER_CUSTOMER,
  MOCK_USER_ADMIN,
  MOCK_PAGINATED_PRODUCTS,
} from '../fixtures';

export async function setupCustomerSession(page: Page): Promise<void> {
  page.setDefaultTimeout(60000);
  await page.context().clearCookies();

  await page.context().addCookies([
    { name: 'auth_token', value: MOCK_JWT_CUSTOMER, url: 'http://localhost:3000' },
  ]);

  await page.route('**/api/auth/session', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ authenticated: true, user: MOCK_USER_CUSTOMER }),
      });
    } else {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    }
  });

  await page.route('**/api/products*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PAGINATED_PRODUCTS),
    });
  });
}

export async function setupAdminSession(page: Page): Promise<void> {
  page.setDefaultTimeout(60000);
  await page.context().clearCookies();

  await page.context().addCookies([
    { name: 'auth_token', value: MOCK_JWT_ADMIN, url: 'http://localhost:3000' },
  ]);

  await page.route('**/api/auth/session', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ authenticated: true, user: MOCK_USER_ADMIN }),
      });
    } else {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    }
  });
}

export async function setupUnauthenticatedSession(page: Page): Promise<void> {
  page.setDefaultTimeout(60000);
  await page.context().clearCookies();

  await page.route('**/api/auth/session', async (route) => {
    await route.fulfill({
      status: 401,
      body: JSON.stringify({ authenticated: false }),
    });
  });

  await page.route('**/api/products*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PAGINATED_PRODUCTS),
    });
  });
}
```

Atualizar `orders.spec.ts` para importar `setupCustomerSession` de `helpers/auth.ts` (remover a função local `setupAuthenticatedSession`).

**Critérios de Aceite:**
- [ ] `frontend/e2e/helpers/auth.ts` criado com `setupCustomerSession`, `setupAdminSession`, `setupUnauthenticatedSession`
- [ ] `orders.spec.ts` removeu a função local `setupAuthenticatedSession` e importa de `helpers/auth.ts`
- [ ] `auth.spec.ts` e `rbac.spec.ts` refatorados para usar os helpers onde aplicável
- [ ] Suite de E2E passa sem regressão

---

### Ação 0.5 — Reescrever `products.controller.spec.ts`

**Arquivo:** `backend/src/products/products.controller.spec.ts`

**Problema:** O arquivo atual contém apenas:
```typescript
it('should be defined', () => {
  expect(controller).toBeDefined();
});
```
Com `ProductsService` fornecido como `{}` (objeto vazio). Isso não testa nada e distorce métricas de cobertura.

**Implementação:**

Reescrever o arquivo com testes reais que cobrem:
- Delegação correta ao service para cada handler
- Override de guards com injeção de usuário no request
- Propagação de `NotFoundException` do service como 404
- Propagação de erros de autorização

Estrutura a implementar:
```typescript
describe('ProductsController', () => {
  let controller: ProductsController;
  let service: jest.Mocked<ProductsService>;

  const mockUser = { userId: 'admin-1', email: 'admin@test.com', role: 'ADMIN' };

  beforeEach(async () => {
    const serviceMock = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: serviceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: (ctx) => { ctx.switchToHttp().getRequest().user = mockUser; return true; } })
      .compile();

    controller = module.get(ProductsController);
    service = module.get(ProductsService);
  });

  describe('findAll', () => {
    it('retorna lista paginada do service', async () => { ... });
  });

  describe('findById', () => {
    it('retorna produto quando ID válido', async () => { ... });
    it('propaga NotFoundException quando ID inválido', async () => { ... });
  });

  describe('create', () => {
    it('delega ao service com payload correto', async () => { ... });
  });

  describe('update', () => {
    it('delega ao service com id e dto corretos', async () => { ... });
    it('propaga NotFoundException quando ID inválido', async () => { ... });
  });

  describe('delete', () => {
    it('delega ao service com id correto', async () => { ... });
    it('propaga NotFoundException quando ID inválido', async () => { ... });
  });
});
```

**Critérios de Aceite:**
- [ ] O arquivo tem pelo menos 10 testes reais (não apenas `toBeDefined`)
- [ ] Cada método do controller (`findAll`, `findById`, `create`, `update`, `delete`) tem pelo menos 1 caso de happy path
- [ ] `findById`, `update` e `delete` têm caso de erro (NotFoundException)
- [ ] Guards são overrideados com injeção correta de `req.user`
- [ ] `pnpm test` no backend passa sem falhas
- [ ] A cobertura de branches do controller aumenta visivelmente no relatório

---

### Ação 0.6 — Remover console logs de debug do `auth.spec.ts`

**Arquivo:** `frontend/e2e/auth.spec.ts`

**Problema:** O `beforeEach` registra listeners `page.on('request')` e `page.on('response')` que logam cada chamada de API, poluindo o output de CI e afetando levemente a performance dos testes.

**Implementação:**
- Remover os blocos `page.on('console', ...)`, `page.on('request', ...)` e `page.on('response', ...)` do `beforeEach`
- Manter apenas `page.setDefaultTimeout(60000)` e os mocks de rota
- Se quiser preservar para debugging pontual, criar um utilitário em `helpers/debug.ts`:
  ```typescript
  export function enableDebugLogs(page: Page): void {
    page.on('request', req => { if (req.url().includes('/api/')) console.log(`>> ${req.method()} ${req.url()}`); });
    page.on('response', res => { if (res.url().includes('/api/')) console.log(`<< ${res.status()} ${res.url()}`); });
  }
  ```
  E chamar explicitamente apenas quando necessário para investigar uma falha.

**Critérios de Aceite:**
- [ ] `beforeEach` de `auth.spec.ts` não possui `page.on('request')`, `page.on('response')` ou `page.on('console')` permanentes
- [ ] Output de `pnpm --filter frontend test:e2e` está limpo — sem linhas `>> REQUEST:` ou `<< RESPONSE:` no log normal
- [ ] Os 4 testes de `auth.spec.ts` continuam passando

---

### Ação 0.7 — Criar factories compartilhadas para o backend

**Arquivo a criar:** `backend/test/helpers/factories.ts`
**Arquivos impactados:** `auth.e2e-spec.ts`, `products.e2e-spec.ts` (futuramente `orders.e2e-spec.ts`)

**Problema:** Payloads de teste (usuários, produtos) são definidos inline em cada arquivo de E2E, gerando duplicação e risco de divergência.

**Implementação:**

Criar `backend/test/helpers/factories.ts`:
```typescript
import { Role, OrderStatus } from '@prisma/client';

// ---- User ----
export function userPayload(overrides: Partial<{
  name: string; email: string; password: string;
}> = {}) {
  return {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    ...overrides,
  };
}

// ---- Product ----
export function productPayload(overrides: Partial<{
  name: string; description: string; price: number;
  category: string; stock: number; imageUrl: string;
}> = {}) {
  return {
    name: 'Test Product',
    description: 'Test description',
    price: 100,
    category: 'Electronics',
    stock: 10,
    imageUrl: 'http://test.com/img.jpg',
    ...overrides,
  };
}

// ---- Order items ----
export function orderItemPayload(productId: string, quantity = 1) {
  return { productId, quantity };
}

export function createOrderPayload(items: { productId: string; quantity: number }[]) {
  return { items };
}
```

**Critérios de Aceite:**
- [ ] `backend/test/helpers/factories.ts` criado com `userPayload`, `productPayload`, `orderItemPayload`, `createOrderPayload`
- [ ] `auth.e2e-spec.ts` usa `userPayload()` ao invés de objeto literal inline para o payload de registro
- [ ] `products.e2e-spec.ts` usa `productPayload()` ao invés de objeto literal inline
- [ ] Tipos TypeScript corretos — sem `any`

---

## Validação Final da Fase 0

Ao término de todas as ações, executar a sequência completa de validação:

```bash
# 1. Backend: todos os unit tests passam
cd backend && pnpm test

# 2. Backend: todos os E2E passam (incluindo auth.e2e-spec TC-E2E-B04)
cd backend && pnpm test:e2e

# 3. Frontend: E2E completo sem fixmes críticos
cd frontend && pnpm test:e2e

# 4. Verificar output limpo (sem logs de request/response)
# Inspecionar output do item 3 — nenhuma linha ">> REQUEST:" ou "<< RESPONSE:"
```

**Critério de saída da Fase 0:**
- [ ] `pnpm test` no backend: 0 falhas, 0 skipped inesperados
- [ ] `pnpm test:e2e` no backend: 0 falhas
- [ ] `pnpm --filter frontend test:e2e`: 0 falhas, nenhum `test.fixme` em testes de fluxo crítico (compra, RBAC, catálogo)
- [ ] Nenhum `waitForTimeout` arbitrário nos specs
- [ ] `frontend/e2e/fixtures/index.ts` e `frontend/e2e/helpers/auth.ts` existem e são usados
- [ ] `backend/test/helpers/factories.ts` existe e é usado em pelo menos 2 arquivos E2E
