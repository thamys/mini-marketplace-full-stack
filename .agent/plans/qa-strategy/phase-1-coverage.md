# Fase 1 — Estabilização da Base de Testes

## Objetivo

Fechar as lacunas de cobertura mais críticas nas camadas existentes — sem adicionar nova infraestrutura. Esta fase foca em:
- Preencher ausências no backend (pipe, controller, E2E de orders)
- Completar fluxos admin ausentes no Playwright
- Expandir casos de erro e autorização já iniciados

Ao final desta fase, todos os endpoints do backend terão cobertura de integração e os fluxos administrativos do frontend terão cobertura E2E.

**Duração estimada:** 3–5 dias
**Prioridade:** Alta
**Pré-requisito:** Fase 0 concluída (suite estável, fixtures centralizadas)
**Risco:** Médio — novos arquivos de teste, sem mudança no código de produção

---

## Ação 1.1 — Testar `ZodValidationPipe` de forma isolada

**Arquivo a criar:** `backend/src/common/pipes/zod-validation.pipe.spec.ts`

**Motivação:** O `ZodValidationPipe` é o único mecanismo de validação de entrada do backend. Falhas nele afetam todos os endpoints. Atualmente não tem nenhum teste unitário — é testado apenas indiretamente via E2E dos controllers.

**Implementação:**

O pipe recebe um schema Zod no construtor e valida o `value` recebido. Estrutura do teste:

```typescript
import { ZodValidationPipe } from './zod-validation.pipe';
import { BadRequestException, ArgumentMetadata } from '@nestjs/common';
import { z } from 'zod';

describe('ZodValidationPipe', () => {
  const metadata: ArgumentMetadata = { type: 'body', metatype: Object, data: '' };

  describe('com schema válido', () => {
    it('retorna o valor transformado quando os dados são válidos', () => { ... });
    it('não modifica campos que não estão no schema (passthrough)', () => { ... });
    it('converte tipos quando Zod faz coerção (ex: string → number)', () => { ... });
  });

  describe('com schema inválido', () => {
    it('lança BadRequestException com message "Validation failed"', () => { ... });
    it('inclui erros por campo em body.errors', () => { ... });
    it('lista múltiplos campos com erro simultaneamente', () => { ... });
    it('inclui mensagem descritiva por campo (não apenas "Required")', () => { ... });
  });

  describe('schema de produto real', () => {
    it('valida payload de criação de produto completo', () => { ... });
    it('rejeita price negativo com mensagem específica', () => { ... });
    it('rejeita name vazio com mensagem específica', () => { ... });
  });
});
```

**Critérios de Aceite:**
- [ ] Arquivo `zod-validation.pipe.spec.ts` criado com pelo menos 8 casos de teste
- [ ] Cobre: dados válidos passam, dados inválidos lançam `BadRequestException`
- [ ] A estrutura de `body.errors` é validada — deve ser `Record<string, string[]>`
- [ ] Cobre múltiplos campos com erro simultaneamente
- [ ] Usa schema Zod real similar ao usado nos DTOs do projeto
- [ ] `pnpm test` no backend passa sem falhas

**Steps de Validação:**
```bash
cd backend && pnpm test --testPathPattern="zod-validation"
# Deve mostrar: ZodValidationPipe > X tests passed
```

---

## Ação 1.2 — Completar testes de `OrdersService` (updateStatus e findAll)

**Arquivo:** `backend/src/orders/orders.service.spec.ts`

**Motivação:** `OrdersService.updateStatus()` e `OrdersService.findAll()` existem no código de produção mas não têm cobertura unitária.

**Casos a adicionar ao `describe('OrdersService')` existente:**

```typescript
describe('TC-11.2.7: updateStatus() com ID válido', () => {
  it('atualiza o status do pedido e retorna pedido com items', async () => {
    // Arrange: findUnique retorna pedido, update retorna pedido atualizado
    // Act: service.updateStatus('order-1', OrderStatus.COMPLETED)
    // Assert: retorna pedido; prisma.order.update chamado com { where: { id }, data: { status }, include: { items: true } }
  });
});

describe('TC-11.2.8: updateStatus() com ID inválido', () => {
  it('lança NotFoundException quando pedido não existe', async () => {
    // Arrange: findUnique retorna null
    // Act + Assert: rejects.toThrow(NotFoundException)
  });
});

describe('TC-11.2.9: findAll() retorna todos os pedidos com user info', () => {
  it('inclui items e user em cada pedido', async () => {
    // Arrange: order.findMany mock retorna array com pedidos + items + user
    // Assert: findMany chamado com orderBy: { createdAt: 'desc' }, include: { items: true, user: { select: {...} } }
  });
});
```

**Atualizar o mock do PrismaService** para incluir `order.findUnique` e `order.update` (atualmente o mock tem apenas `order.findMany`):
```typescript
const prismaServiceMock = {
  product: { findMany: jest.fn() },
  order: {
    findMany: jest.fn(),
    findUnique: jest.fn(),   // adicionar
    update: jest.fn(),       // adicionar
  },
  $transaction: jest.fn(),
};
```

**Critérios de Aceite:**
- [ ] 3 novos casos adicionados: updateStatus (sucesso), updateStatus (não encontrado), findAll
- [ ] Mock do PrismaService atualizado para incluir `order.findUnique` e `order.update`
- [ ] `updateStatus` com `NotFoundException` confirma que `order.update` não é chamado quando `findUnique` retorna null
- [ ] `findAll` confirma que o `include` contém `user: { select: { id, email, name } }`
- [ ] `pnpm test --testPathPattern="orders.service"` passa sem falhas

---

## Ação 1.3 — Criar E2E de integração para Orders

**Arquivo a criar:** `backend/test/orders.e2e-spec.ts`

**Motivação:** Orders é o domínio de maior risco de negócio (transação atômica, controle de estoque, RBAC) e está completamente sem cobertura de integração com banco real.

**Setup necessário:**
- Criar produtos e usuários de teste no `beforeAll`
- Limpar orders, order_items e produtos no `afterAll`
- Gerar tokens admin e customer via `jwtService.sign()`

**Casos a implementar:**

```typescript
describe('OrdersController (e2e)', () => {
  // Setup: app, prisma, tokens, produto de teste criado no banco

  describe('POST /orders', () => {
    it('TC-12.E2E.1: customer + itens válidos → 201 com pedido e items', ...);
    // Assert: status 201, body.id existe, body.items.length === dto.items.length
    // Assert: body.items[0].productName === nome do produto no banco
    // Assert: body.items[0].unitPrice === preço do produto no banco (snapshot)

    it('TC-12.E2E.2: customer + estoque insuficiente → 400 com INSUFFICIENT_STOCK e details', ...);
    // Arrange: produto com stock=1, requisitar quantity=5
    // Assert: status 400, body.error === 'INSUFFICIENT_STOCK'
    // Assert: body.details[0].productId, .requested, .available presentes

    it('TC-12.E2E.3: customer + productId inexistente → 400', ...);
    // Assert: status 400, mensagem contém ID inválido

    it('TC-12.E2E.4: admin tentando criar pedido → 403', ...);
    // Assert: status 403

    it('TC-12.E2E.5: sem token → 401', ...);
    // Assert: status 401

    it('TC-12.E2E.6: estoque é decrementado após criação bem-sucedida', ...);
    // Arrange: produto com stock=5, criar pedido com quantity=2
    // Assert: buscar produto no banco após criação, stock === 3
  });

  describe('GET /orders', () => {
    it('TC-12.E2E.7: admin vê todos os pedidos com user info', ...);
    // Arrange: criar pedidos de 2 usuários diferentes
    // Assert: admin recebe todos; cada pedido tem { user: { id, email, name } }

    it('TC-12.E2E.8: customer vê apenas os seus próprios pedidos', ...);
    // Arrange: criar pedidos de 2 usuários diferentes
    // Assert: customer recebe apenas os seus (filtro por userId)

    it('TC-12.E2E.9: sem token → 401', ...);
  });

  describe('PATCH /orders/:id/status', () => {
    it('TC-12.E2E.10: admin + status válido → 200 com pedido atualizado', ...);
    // Assert: status 200, body.status === 'COMPLETED'

    it('TC-12.E2E.11: admin + ID inválido → 404', ...);

    it('TC-12.E2E.12: customer tentando atualizar status → 403', ...);

    it('TC-12.E2E.13: sem token → 401', ...);
  });
});
```

**Critérios de Aceite:**
- [ ] Arquivo `backend/test/orders.e2e-spec.ts` criado com os 13 casos descritos
- [ ] `beforeAll` cria produto real no banco via `prisma.product.create`
- [ ] `afterAll` limpa orders, order_items e produtos criados no teste
- [ ] TC-12.E2E.1 valida snapshot: `unitPrice` e `productName` no `OrderItem` correspondem ao produto no momento da criação
- [ ] TC-12.E2E.6 verifica redução de estoque diretamente no banco via `prisma.product.findUnique`
- [ ] TC-12.E2E.7 confirma que a resposta admin inclui `user.email` em cada pedido
- [ ] TC-12.E2E.8 confirma isolamento de dados entre usuários (customer A não vê pedidos do customer B)
- [ ] `pnpm test:e2e` no backend passa com 0 falhas

**Steps de Validação:**
```bash
cd backend && pnpm test:e2e --testPathPattern="orders"
# Deve mostrar: OrdersController (e2e) > 13 tests passed
```

---

## Ação 1.4 — Criar E2E Playwright para admin/products

**Arquivo a criar:** `frontend/e2e/admin-products.spec.ts`

**Motivação:** O fluxo de gestão de produtos pelo admin (criar, editar, excluir) é crítico para o negócio e completamente ausente no E2E. `admin-layout.spec.ts` testa apenas estrutura/navegação, não operações reais.

**Dependências:** `setupAdminSession` de `helpers/auth.ts` (criado na Fase 0)

**Casos a implementar:**

```typescript
test.describe('Admin — Gerenciamento de Produtos', () => {
  test.beforeEach(async ({ page }) => {
    await setupAdminSession(page);
    // Mock de listagem de produtos para a página
    await page.route('**/api/proxy/products*', ...);
    await page.goto('/admin/products', { waitUntil: 'domcontentloaded' });
  });

  test('TC-ADM-PROD-01: Criar produto — formulário válido exibe toast de sucesso', async ({ page }) => {
    // Mock POST /products → 201 com produto criado
    // Abrir modal/form de criação
    // Preencher campos: name, description, price, category, stock, imageUrl
    // Submeter
    // Assert: toast "Produto criado com sucesso!" visível
    // Assert: modal fechado
  });

  test('TC-ADM-PROD-02: Criar produto — campos obrigatórios ausentes exibem erros de validação', async ({ page }) => {
    // Abrir modal/form de criação
    // Submeter sem preencher campos
    // Assert: mensagens de erro de validação visíveis para campos obrigatórios
  });

  test('TC-ADM-PROD-03: Editar produto — modal abre com dados pré-preenchidos', async ({ page }) => {
    // Mock GET /products/:id com dados conhecidos
    // Clicar em botão de editar de um produto
    // Assert: campos do formulário pré-preenchidos com dados do produto
  });

  test('TC-ADM-PROD-04: Editar produto — alterar preço e salvar exibe toast de sucesso', async ({ page }) => {
    // Mock PUT /products/:id → 200 com produto atualizado
    // Abrir edição, alterar campo de preço
    // Salvar
    // Assert: toast de sucesso visível
  });

  test('TC-ADM-PROD-05: Excluir produto — exibe dialog de confirmação', async ({ page }) => {
    // Clicar em botão de excluir
    // Assert: dialog/alert de confirmação visível
    // Assert: texto de confirmação contém nome do produto
  });

  test('TC-ADM-PROD-06: Excluir produto — confirmar exclusão exibe toast de sucesso', async ({ page }) => {
    // Mock DELETE /products/:id → 204
    // Clicar em excluir → confirmar
    // Assert: toast de sucesso visível
    // Assert: produto removido da listagem
  });

  test('TC-ADM-PROD-07: Excluir produto — cancelar no dialog não remove o produto', async ({ page }) => {
    // Clicar em excluir → cancelar no dialog
    // Assert: produto ainda visível na listagem
    // Assert: nenhum request DELETE foi feito
  });
});
```

**Critérios de Aceite:**
- [ ] 7 casos implementados cobrindo criar, editar e excluir
- [ ] Todos os testes usam `data-testid` para seletores — sem seletores por texto de botão que possam mudar
- [ ] Mocks de rotas usam `page.route('**/api/proxy/products*')` para simular o BFF (não direto ao backend)
- [ ] Toast de sucesso é validado pelo `data-testid` ou pelo texto específico
- [ ] TC-ADM-PROD-07 confirma que o request DELETE não foi disparado (verificar via `page.route` com contador)
- [ ] `pnpm --filter frontend test:e2e` passa sem falhas

---

## Ação 1.5 — Criar E2E Playwright para admin/orders

**Arquivo a criar:** `frontend/e2e/admin-orders.spec.ts`

**Motivação:** A gestão de pedidos pelo admin (ver todos, atualizar status) não tem cobertura E2E alguma. É um fluxo de alto valor para o negócio.

**Casos a implementar:**

```typescript
test.describe('Admin — Gerenciamento de Pedidos', () => {
  test.beforeEach(async ({ page }) => {
    await setupAdminSession(page);
  });

  test('TC-ADM-ORD-01: Admin vê todos os pedidos de todos os usuários', async ({ page }) => {
    // Mock GET /api/proxy/orders → array com pedidos de usuários diferentes
    // Navegar para /admin/orders
    // Assert: todos os pedidos visíveis na tabela
    // Assert: coluna com email do cliente visível
  });

  test('TC-ADM-ORD-02: Admin vê estado vazio quando não há pedidos', async ({ page }) => {
    // Mock GET /api/proxy/orders → []
    // Assert: mensagem de "nenhum pedido encontrado" visível
  });

  test('TC-ADM-ORD-03: Admin atualiza status de PENDING para COMPLETED', async ({ page }) => {
    // Mock GET orders → pedido com status PENDING
    // Mock PATCH /orders/:id/status → pedido com status COMPLETED
    // Interagir com dropdown/select de status
    // Assert: toast de sucesso visível
    // Assert: status exibido na tabela atualizado para COMPLETED
  });

  test('TC-ADM-ORD-04: Admin atualiza status de PENDING para CANCELLED', async ({ page }) => {
    // Similar ao TC-ADM-ORD-03 mas com CANCELLED
  });

  test('TC-ADM-ORD-05: Customer não consegue acessar /admin/orders — redireciona', async ({ page }) => {
    // Configurar sessão de customer com cookie
    // Navegar para /admin/orders
    // Assert: URL redirecionada para /
  });
});
```

**Critérios de Aceite:**
- [ ] 5 casos implementados cobrindo listagem e atualização de status
- [ ] TC-ADM-ORD-01 valida que informações do cliente (email ou nome) estão visíveis na listagem admin
- [ ] TC-ADM-ORD-03 e TC-ADM-ORD-04 validam a atualização de status via UI
- [ ] TC-ADM-ORD-05 usa cookie de customer e valida redirecionamento (testando o middleware)
- [ ] `pnpm --filter frontend test:e2e` passa sem falhas

---

## Ação 1.6 — Expandir `auth.spec.ts` com logout

**Arquivo:** `frontend/e2e/auth.spec.ts`

**Motivação:** O logout é um fluxo de segurança crítico. Atualmente não está coberto — apenas login está testado.

**Casos a adicionar:**

```typescript
test('TC-05: Logout — deve limpar sessão e redirecionar para /login', async ({ page }) => {
  // Setup: sessão autenticada como customer (cookie + mock session)
  // Navegar para / (catálogo)
  // Clicar no botão/menu de logout (data-testid="logout-button" ou similar)
  // Assert: DELETE /api/auth/session foi chamado
  // Assert: URL redireciona para /login
  // Assert: tentativa de acessar /orders redireciona para /login (sessão limpa)
});

test('TC-06: Logout de admin — deve redirecionar para /login', async ({ page }) => {
  // Setup: sessão autenticada como admin
  // Navegar para /admin
  // Executar logout
  // Assert: redireciona para /login
  // Assert: /admin não acessível após logout
});
```

**Critérios de Aceite:**
- [ ] TC-05 valida que o request `DELETE /api/auth/session` é disparado
- [ ] TC-05 valida redirecionamento para `/login` após logout
- [ ] TC-06 repete para o fluxo de admin
- [ ] Usa `data-testid` estável para o botão de logout
- [ ] Não usa `waitForTimeout` — usa `waitForURL` ou assertion baseada em estado

---

## Ação 1.7 — Expandir `register.spec.ts` com erros de validação

**Arquivo:** `frontend/e2e/register.spec.ts`

**Motivação:** Garantir que os erros de validação do formulário de cadastro são exibidos corretamente ao usuário.

**Casos a adicionar/verificar:**

```typescript
test('TC-REG-02: Campos obrigatórios ausentes exibem erros inline', async ({ page }) => {
  // Clicar em Submit sem preencher nada
  // Assert: erro visível para campo "nome"
  // Assert: erro visível para campo "email"
  // Assert: erro visível para campo "senha"
});

test('TC-REG-03: Email inválido exibe erro de formato', async ({ page }) => {
  // Preencher email com "nao-e-email"
  // Submit ou blur
  // Assert: mensagem de erro de formato visível
});

test('TC-REG-04: Senha muito curta exibe erro de comprimento mínimo', async ({ page }) => {
  // Preencher senha com "abc" (menos de 6/8 chars — verificar regra real)
  // Assert: mensagem de erro de comprimento visível
});

test('TC-REG-05: Email já cadastrado exibe erro 409', async ({ page }) => {
  // Mock POST /auth/register → 409
  // Preencher e submeter
  // Assert: mensagem de email já em uso visível
});
```

**Critérios de Aceite:**
- [ ] Pelo menos 4 casos de erro de validação cobertos
- [ ] Os seletores de erro usam `data-testid` ou roles ARIA estáveis
- [ ] As mensagens de erro esperadas nos asserts correspondem às mensagens reais do código (`frontend/app/(shop)/register/page.tsx`)
- [ ] `pnpm --filter frontend test:e2e` passa sem falhas

---

## Validação Final da Fase 1

```bash
# 1. Backend: unit tests (incluindo novos: pipe, updateStatus, findAll)
cd backend && pnpm test
# Resultado esperado: ~40+ testes passando, incluindo zod-validation.pipe.spec.ts

# 2. Backend: E2E completo (incluindo novo orders.e2e-spec.ts)
cd backend && pnpm test:e2e
# Resultado esperado: ~35+ testes passando, 0 falhas

# 3. Frontend: E2E completo (incluindo novos admin-products, admin-orders)
cd frontend && pnpm test:e2e
# Resultado esperado: ~40+ testes passando, 0 falhas, 0 fixmes críticos
```

**Critério de saída da Fase 1:**
- [ ] `ZodValidationPipe` tem cobertura unitária isolada
- [ ] `OrdersService.updateStatus` e `findAll` têm cobertura unitária
- [ ] Todos os endpoints de orders têm cobertura de integração com banco real
- [ ] Fluxos de admin (products e orders) têm cobertura E2E
- [ ] Logout coberto no E2E
- [ ] Erros de validação do registro cobertos
- [ ] 0 testes de stub (`toBeDefined` solitário) no projeto
- [ ] Nenhum `fixme` ativo em fluxos de negócio críticos (compra, RBAC, orders admin)
