# Fase 2 — Frontend Unitário + Contratos de API

## Objetivo

Adicionar cobertura unitária no frontend (lógica de negócio client-side) e estabelecer contratos de API formais entre frontend e backend. Esta fase resolve a maior lacuna estrutural do projeto: a ausência de testes para lógica crítica do cliente e a inexistência de qualquer mecanismo que garanta alinhamento de contratos entre as duas camadas.

**Duração estimada:** 3–5 dias
**Prioridade:** Alta
**Pré-requisito:** Fase 1 concluída
**Risco:** Médio — requer instalação de nova toolchain (Jest + RTL) no frontend, que pode ter atrito com Next.js App Router

---

## Ação 2.1 — Instalar e configurar Jest + React Testing Library no frontend

**Arquivos a criar/modificar:**
- `frontend/package.json` — novas dependências
- `frontend/jest.config.ts` — configuração
- `frontend/jest.setup.ts` — setup global

**Motivação:** O frontend não tem nenhuma ferramenta de testes unitários instalada. Jest + RTL é a combinação mais compatível com o stack atual (Next.js 16, React 19, TypeScript).

**Implementação:**

Instalar dependências:
```bash
cd frontend && pnpm add -D jest ts-jest jest-environment-jsdom \
  @testing-library/react @testing-library/user-event \
  @testing-library/jest-dom @types/jest
```

Criar `frontend/jest.config.ts`:
```typescript
import type { Config } from 'jest';

const config: Config = {
  displayName: 'frontend',
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: { jsx: 'react-jsx' },
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Mock de CSS e assets estáticos
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.ts',
    '\\.(png|jpg|svg|gif)$': '<rootDir>/__mocks__/fileMock.ts',
  },
  testPathPattern: '^(?!.*/e2e/).*\\.spec\\.(ts|tsx)$',
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/index.ts',
  ],
  coverageDirectory: 'coverage-unit',
};

export default config;
```

Criar `frontend/jest.setup.ts`:
```typescript
import '@testing-library/jest-dom';
```

Criar `frontend/__mocks__/styleMock.ts`:
```typescript
export default {};
```

Criar `frontend/__mocks__/fileMock.ts`:
```typescript
export default 'test-file-stub';
```

Adicionar scripts ao `frontend/package.json`:
```json
{
  "scripts": {
    "test:unit": "jest",
    "test:unit:watch": "jest --watch",
    "test:unit:cov": "jest --coverage"
  }
}
```

**Critérios de Aceite:**
- [ ] `pnpm --filter frontend test:unit` executa sem erros de configuração
- [ ] Um teste trivial de sanidade passa: `expect(1 + 1).toBe(2)`
- [ ] `@testing-library/jest-dom` matchers disponíveis (`toBeInTheDocument`, `toBeVisible`, etc.)
- [ ] Alias `@/` resolve para a raiz do projeto
- [ ] Testes em `e2e/` **não** são capturados pelo Jest (apenas pelo Playwright)
- [ ] `pnpm --filter frontend test:e2e` (Playwright) continua funcionando sem impacto

---

## Ação 2.2 — Testar `cart-context` de forma unitária

**Arquivo a criar:** `frontend/lib/cart-context.spec.tsx`

**Motivação:** O `cart-context` é a lógica de negócio mais crítica do frontend. Ele gerencia adição/remoção de itens, respeita limites de estoque e persiste estado em `sessionStorage`. Atualmente tem cobertura zero. Bugs aqui afetam diretamente a jornada de compra.

**Implementação:**

Ler a implementação real de `lib/cart-context.tsx` antes de escrever os testes para entender:
- Interface do contexto (funções expostas, formato do estado)
- Chave de sessionStorage utilizada
- Comportamento ao exceder o estoque

Estrutura dos testes:
```typescript
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from './cart-context';
import { MOCK_PRODUCT_1, MOCK_PRODUCT_2 } from '../e2e/fixtures'; // reutilizar fixtures

// Helper para renderizar o hook com o provider
const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;

describe('useCart — cart-context', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe('Estado inicial', () => {
    it('inicia com carrinho vazio', () => { ... });
    it('carrega itens persistidos do sessionStorage na inicialização', () => { ... });
  });

  describe('addItem', () => {
    it('adiciona produto ao carrinho', () => { ... });
    it('incrementa quantidade ao adicionar produto já existente', () => { ... });
    it('não ultrapassa o stock do produto', () => { ... });
    it('não adiciona produto com stock=0', () => { ... });
  });

  describe('removeItem', () => {
    it('remove item do carrinho pelo productId', () => { ... });
    it('não falha ao tentar remover produto inexistente', () => { ... });
  });

  describe('updateQuantity', () => {
    it('atualiza a quantidade de um item', () => { ... });
    it('respeita o limite de stock ao aumentar quantidade', () => { ... });
    it('quantidade 0 remove o item do carrinho', () => { ... });
  });

  describe('clearCart', () => {
    it('esvazia o carrinho', () => { ... });
    it('limpa o sessionStorage ao esvaziar', () => { ... });
  });

  describe('Persistência em sessionStorage', () => {
    it('persiste alterações no sessionStorage após addItem', () => { ... });
    it('persiste alterações no sessionStorage após removeItem', () => { ... });
    it('carrega estado correto após simular reload (re-render do provider)', () => { ... });
  });

  describe('itemCount / total', () => {
    it('calcula itemCount corretamente com múltiplos produtos', () => { ... });
    it('calcula total monetário corretamente', () => { ... });
  });
});
```

**Nota:** Os nomes exatos das funções (`addItem`, `removeItem`, etc.) devem ser confirmados lendo `lib/cart-context.tsx`.

**Critérios de Aceite:**
- [ ] Pelo menos 15 casos de teste cobrindo o ciclo de vida completo do carrinho
- [ ] Todos os testes passam isoladamente (sem dependência de ordem)
- [ ] sessionStorage é limpo no `beforeEach` para evitar contaminação entre testes
- [ ] Cobre o caso de stock=0 (produto não pode ser adicionado)
- [ ] Cobre persistência e recuperação do sessionStorage
- [ ] Cobre cálculo de total monetário
- [ ] `pnpm --filter frontend test:unit` passa sem falhas

---

## Ação 2.3 — Testar `auth-context` de forma unitária

**Arquivo a criar:** `frontend/lib/auth-context.spec.tsx`

**Motivação:** O estado de autenticação (usuário, loading, funções de login/logout) é a fundação de toda a experiência autenticada. Bugs aqui afetam todos os fluxos protegidos.

**Implementação:**

Ler `lib/auth-context.tsx` para entender a API exposta e como a sessão é gerenciada (TanStack Query, axios).

O principal desafio será mockar as chamadas axios para `/api/auth/session`. Usar `jest.mock('axios')` ou interceptar com `msw` (hipótese: começar com jest.mock por ser mais simples).

```typescript
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './auth-context';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('useAuth — auth-context', () => {
  describe('Estado inicial', () => {
    it('inicia com user=null e isAuthenticated=false', async () => { ... });
    it('isLoading=true enquanto verifica sessão', async () => { ... });
  });

  describe('Sessão ativa', () => {
    it('define user quando sessão retorna usuário autenticado', async () => {
      // Mock GET /api/auth/session → { authenticated: true, user: MOCK_USER_CUSTOMER }
      // Assert: isAuthenticated=true, user.email === MOCK_USER_CUSTOMER.email
    });
  });

  describe('Sessão inativa', () => {
    it('mantém user=null quando sessão retorna 401', async () => { ... });
  });

  describe('login()', () => {
    it('chama POST /api/auth/login e POST /api/auth/session com o token', async () => { ... });
    it('define user após login bem-sucedido', async () => { ... });
    it('lança erro quando credenciais são inválidas', async () => { ... });
  });

  describe('logout()', () => {
    it('chama DELETE /api/auth/session', async () => { ... });
    it('limpa user após logout', async () => { ... });
  });
});
```

**Critérios de Aceite:**
- [ ] Pelo menos 8 casos de teste
- [ ] Mocking de chamadas axios sem dependência de rede real
- [ ] Cobre estados de loading, autenticado e não autenticado
- [ ] Cobre login (sucesso e falha) e logout
- [ ] `pnpm --filter frontend test:unit` passa sem falhas

---

## Ação 2.4 — Testar componentes de UI críticos

**Arquivos a criar:**
- `frontend/components/product-card.spec.tsx`
- `frontend/components/pagination.spec.tsx`

**Motivação:** Componentes que impactam diretamente a UX de compra precisam de testes de comportamento isolados.

**`product-card.spec.tsx`:**
```typescript
describe('ProductCard', () => {
  it('renderiza nome e preço do produto', () => { ... });
  it('renderiza badge "Esgotado" quando stock=0', () => { ... });
  it('botão "Adicionar ao carrinho" está desabilitado quando stock=0', () => { ... });
  it('botão "Adicionar ao carrinho" está habilitado quando stock>0', () => { ... });
  it('chama callback onAddToCart ao clicar no botão', () => { ... });
  it('navega para /products/:id ao clicar no card', () => { ... });
});
```

**`pagination.spec.tsx`:**
```typescript
describe('Pagination', () => {
  it('não renderiza quando totalPages=1', () => { ... });
  it('botão "Anterior" desabilitado na página 1', () => { ... });
  it('botão "Próximo" desabilitado na última página', () => { ... });
  it('chama onPageChange com página correta ao clicar em número', () => { ... });
  it('exibe página atual destacada', () => { ... });
});
```

**Critérios de Aceite:**
- [ ] `product-card.spec.tsx`: 6 casos cobrindo renderização, estados de stock e interação
- [ ] `pagination.spec.tsx`: 5 casos cobrindo limites de navegação e callbacks
- [ ] Nomes dos `data-testid` utilizados nos testes coincidem com os do código de produção
- [ ] Sem snapshot tests — apenas assertions comportamentais
- [ ] `pnpm --filter frontend test:unit` passa sem falhas

---

## Ação 2.5 — Testar utilitários da camada de API

**Arquivo a criar:** `frontend/lib/api/products.spec.ts`

**Motivação:** Garantir que as funções de API usam a instância correta (`api` vs `bffApi`) e montam os parâmetros corretos. Isso valida o padrão BFF sem precisar de E2E.

**Implementação:**

Mockar as instâncias axios:
```typescript
// Mockar lib/api.ts
jest.mock('../api', () => ({
  api: { get: jest.fn() },
  bffApi: { post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
import { api, bffApi } from '../api';
```

Casos:
```typescript
describe('products API', () => {
  describe('getProducts', () => {
    it('usa api (público) para listar produtos', () => { ... });
    it('monta query string corretamente com page e limit', () => { ... });
    it('inclui search na query quando fornecido', () => { ... });
    it('inclui category na query quando fornecido', () => { ... });
  });

  describe('getProductById', () => {
    it('usa api (público) para buscar produto por ID', () => { ... });
    it('monta URL corretamente com o ID', () => { ... });
  });

  describe('createProduct', () => {
    it('usa bffApi (autenticado) para criar produto', () => { ... });
    it('envia o payload correto', () => { ... });
  });

  describe('updateProduct', () => {
    it('usa bffApi (autenticado) para atualizar produto', () => { ... });
    it('envia para a URL correta com o ID', () => { ... });
  });

  describe('deleteProduct', () => {
    it('usa bffApi (autenticado) para deletar produto', () => { ... });
  });
});
```

**Critérios de Aceite:**
- [ ] Cada função de produto tem pelo menos 1 teste verificando qual instância axios é usada
- [ ] `getProducts`, `getProductById` → confirmam uso de `api` (não `bffApi`)
- [ ] `createProduct`, `updateProduct`, `deleteProduct` → confirmam uso de `bffApi`
- [ ] `pnpm --filter frontend test:unit` passa sem falhas

---

## Ação 2.6 — Criar schemas Zod para contract testing nos E2E backend

**Arquivo a criar:** `backend/test/schemas/index.ts` (ou arquivos separados por domínio)

**Motivação:** Sem contratos formais, uma mudança no shape de resposta do backend (ex: campo `expiresIn` → `expires_in`, ou `user.role` adicionando novo valor de enum) passaria despercebida pelos testes atuais e quebraria o frontend silenciosamente em produção.

**Implementação:**

Criar `backend/test/schemas/auth.schema.ts`:
```typescript
import { z } from 'zod';

export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['CUSTOMER', 'ADMIN']),
});

export const AuthResponseSchema = z.object({
  access_token: z.string(),
  expiresIn: z.string(),
  user: UserResponseSchema,
});
```

Criar `backend/test/schemas/product.schema.ts`:
```typescript
import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.string(), // Prisma Decimal serializado como string
  category: z.string(),
  stock: z.number().int().nonnegative(),
  imageUrl: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export const PaginatedProductsSchema = z.object({
  data: z.array(ProductSchema),
  meta: z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().nonneg(),
  }),
});
```

Criar `backend/test/schemas/order.schema.ts`:
```typescript
import { z } from 'zod';

export const OrderItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  productId: z.string(),
  productName: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.string(), // Prisma Decimal serializado como string
});

export const OrderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  total: z.string(), // Prisma Decimal serializado como string
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']),
  createdAt: z.string().datetime(),
  items: z.array(OrderItemSchema),
});

export const AdminOrderSchema = OrderSchema.extend({
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
  }),
});
```

**Integrar nos E2E existentes:**

Em `backend/test/auth.e2e-spec.ts`, após o assert de status:
```typescript
import { AuthResponseSchema } from './schemas/auth.schema';

// TC-E2E-B01
const parseResult = AuthResponseSchema.safeParse(response.body);
expect(parseResult.success).toBe(true);
if (!parseResult.success) {
  console.error('Contract violations:', parseResult.error.format());
}
```

Em `backend/test/products.e2e-spec.ts`:
```typescript
import { ProductSchema, PaginatedProductsSchema } from './schemas/product.schema';

// TC-09.2.1: validar shape do produto criado
const parseResult = ProductSchema.safeParse(response.body);
expect(parseResult.success).toBe(true);
```

Em `backend/test/orders.e2e-spec.ts` (criado na Fase 1):
```typescript
import { OrderSchema, AdminOrderSchema } from './schemas/order.schema';

// TC-12.E2E.1: validar shape do pedido criado
const parseResult = OrderSchema.safeParse(response.body);
expect(parseResult.success).toBe(true);
```

**Critérios de Aceite:**
- [ ] `backend/test/schemas/` criado com `auth.schema.ts`, `product.schema.ts`, `order.schema.ts`
- [ ] Schemas exportam tipos TypeScript derivados via `z.infer<>`
- [ ] `auth.e2e-spec.ts`: TC-E2E-B01 (register) e TC-E2E-B04 (login) validam shape via `AuthResponseSchema`
- [ ] `products.e2e-spec.ts`: TC-09.2.1 (create) e `GET /products` validam shape via schemas correspondentes
- [ ] `orders.e2e-spec.ts`: TC-12.E2E.1 (create order) e TC-12.E2E.7 (admin GET) validam shape
- [ ] Se um schema falha, o erro de Zod é logado com `console.error(parseResult.error.format())` para diagnóstico imediato
- [ ] `pnpm test:e2e` no backend passa com os schemas integrados

---

## Validação Final da Fase 2

```bash
# 1. Frontend: unit tests
cd frontend && pnpm test:unit
# Resultado esperado: ~40+ testes passando

# 2. Frontend: cobertura de branches críticos
cd frontend && pnpm test:unit:cov
# Resultado esperado: cart-context >80% branches, auth-context >70% branches

# 3. Backend: E2E com contract assertions
cd backend && pnpm test:e2e
# Resultado esperado: todos passando, sem violações de schema

# 4. Smoke: Playwright ainda funciona após mudanças
cd frontend && pnpm test:e2e
# Resultado esperado: sem regressões
```

**Critério de saída da Fase 2:**
- [ ] Jest + RTL instalados e configurados no frontend
- [ ] `cart-context` tem ≥15 testes unitários cobrindo ciclo de vida completo
- [ ] `auth-context` tem ≥8 testes unitários
- [ ] Componentes `product-card` e `pagination` têm testes comportamentais
- [ ] Funções de API verificam uso correto de `api` vs `bffApi`
- [ ] Schemas Zod existem para auth, products e orders
- [ ] Schemas integrados nos E2E backend de cada domínio
- [ ] Nenhuma violação de contrato ao rodar os E2E backend
