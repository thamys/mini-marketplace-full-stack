# Backlog de Casos de Teste

Casos de teste priorizados por valor de negócio e risco técnico. Organizados por camada e fase de implementação.

**Legenda de Prioridade:**
- **P0** — Bloqueador. Deve existir antes de ir para produção.
- **P1** — Alta. Implementar na próxima sprint após P0.
- **P2** — Média. Cobertura adicional de qualidade.
- **P3** — Baixa. Nice-to-have quando houver espaço.

---

## Unit Tests — Backend

### Auth

| ID | Título | Objetivo | Arquivo | Fase | Prioridade | Status | Dependências | Observações |
|---|---|---|---|---|---|---|---|---|
| UT-AUTH-01 | AuthService: register com dados válidos retorna token e user | Verificar o fluxo feliz de registro | `auth.service.spec.ts` | Existente | P0 | ✅ Existe | — | Manter sem alterações |
| UT-AUTH-02 | AuthService: register com email duplicado lança ConflictException | Garantir unicidade de email | `auth.service.spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| UT-AUTH-03 | AuthService: login com credenciais válidas retorna token e user | Fluxo feliz de login | `auth.service.spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| UT-AUTH-04 | AuthService: login com email inexistente lança UnauthorizedException | Prevenir enumeração de usuários | `auth.service.spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| UT-AUTH-05 | AuthService: login com senha incorreta lança UnauthorizedException | Segurança de credenciais | `auth.service.spec.ts` | Existente | P0 | ✅ Existe | — | Manter |

### Products

| ID | Título | Objetivo | Arquivo | Fase | Prioridade | Status | Dependências | Observações |
|---|---|---|---|---|---|---|---|---|
| UT-PROD-01 | ProductsService: findAll sem filtros retorna data + meta corretos | Paginação básica | `products.service.spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| UT-PROD-02 | ProductsService: findAll com search filtra por nome | Busca textual | `products.service.spec.ts` | Existente | P1 | ✅ Existe | — | Manter |
| UT-PROD-03 | ProductsService: findAll com category filtra por categoria | Filtro de categoria | `products.service.spec.ts` | Existente | P1 | ✅ Existe | — | Manter |
| UT-PROD-04 | ProductsService: findAll paginação calcula skip e take corretos | Offset de paginação | `products.service.spec.ts` | Existente | P1 | ✅ Existe | — | Manter |
| UT-PROD-05 | ProductsService: findAll meta.total e totalPages corretos | Metadados de paginação | `products.service.spec.ts` | Existente | P1 | ✅ Existe | — | Manter |
| UT-PROD-06 | ProductsService: findById com ID válido retorna produto | Happy path | `products.service.spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| UT-PROD-07 | ProductsService: findById com ID inválido lança NotFoundException | Recurso inexistente | `products.service.spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| UT-PROD-08 | ProductsService: create com payload válido retorna produto criado | CRUD básico | `products.service.spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| UT-PROD-09 | ProductsService: create converte price para Prisma.Decimal | Precisão financeira | `products.service.spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| UT-PROD-10 | ProductsService: update com ID válido retorna produto atualizado | CRUD básico | `products.service.spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| UT-PROD-11 | ProductsService: update com ID inválido lança NotFoundException | Recurso inexistente | `products.service.spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| UT-PROD-12 | ProductsService: delete com ID válido remove produto | CRUD básico | `products.service.spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| UT-PROD-13 | ProductsController: findAll delega ao service com query params | Routing correto | `products.controller.spec.ts` | Fase 0 | P1 | ❌ Ausente | Reescrever stub | |
| UT-PROD-14 | ProductsController: findById propaga NotFoundException como 404 | Propagação de erro | `products.controller.spec.ts` | Fase 0 | P1 | ❌ Ausente | Reescrever stub | |
| UT-PROD-15 | ProductsController: create com guard injetado delega ao service | Guard + routing | `products.controller.spec.ts` | Fase 0 | P1 | ❌ Ausente | Reescrever stub | |
| UT-PROD-16 | ProductsController: update com ID inválido propaga NotFoundException | Propagação de erro | `products.controller.spec.ts` | Fase 0 | P1 | ❌ Ausente | Reescrever stub | |
| UT-PROD-17 | ProductsController: delete com ID inválido propaga NotFoundException | Propagação de erro | `products.controller.spec.ts` | Fase 0 | P1 | ❌ Ausente | Reescrever stub | |

### Orders

| ID | Título | Objetivo | Arquivo | Fase | Prioridade | Status | Dependências | Observações |
|---|---|---|---|---|---|---|---|---|
| UT-ORD-01 | OrdersService: create calcula total corretamente | Cálculo financeiro | `orders.service.spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| UT-ORD-02 | OrdersService: create faz snapshot de productName e unitPrice | Integridade de dados históricos | `orders.service.spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| UT-ORD-03 | OrdersService: create com productId inexistente lança BadRequestException | Produto inválido | `orders.service.spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| UT-ORD-04 | OrdersService: create com estoque insuficiente lança INSUFFICIENT_STOCK | Controle de estoque | `orders.service.spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| UT-ORD-05 | OrdersService: create com conflito parcial de estoque rejeita o pedido inteiro | Atomicidade | `orders.service.spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| UT-ORD-06 | OrdersService: findByUser retorna pedidos do usuário ordenados por data | Isolamento de dados | `orders.service.spec.ts` | Existente | P1 | ✅ Existe | — | Manter |
| UT-ORD-07 | OrdersService: updateStatus com ID válido retorna pedido atualizado | Gestão de status | `orders.service.spec.ts` | Fase 1 | P1 | ❌ Ausente | Fase 1 | Adicionar à Ação 1.2 |
| UT-ORD-08 | OrdersService: updateStatus com ID inválido lança NotFoundException | Recurso inexistente | `orders.service.spec.ts` | Fase 1 | P1 | ❌ Ausente | Fase 1 | Adicionar à Ação 1.2 |
| UT-ORD-09 | OrdersService: findAll retorna pedidos de todos os usuários com user info | Visão admin | `orders.service.spec.ts` | Fase 1 | P1 | ❌ Ausente | Fase 1 | Adicionar à Ação 1.2 |
| UT-ORD-10 | OrdersController: create retorna 201 com pedido criado | Happy path | `orders.controller.spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| UT-ORD-11 | OrdersController: create propaga INSUFFICIENT_STOCK do service | Propagação de erro | `orders.controller.spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| UT-ORD-12 | OrdersController: findOrders retorna pedidos do customer | Roteamento por role | `orders.controller.spec.ts` | Existente | P1 | ✅ Existe | — | Manter |
| UT-ORD-13 | OrdersController: findOrders retorna todos os pedidos para admin | Roteamento por role | `orders.controller.spec.ts` | Existente | P1 | ✅ Existe | — | Manter |

### ZodValidationPipe

| ID | Título | Objetivo | Arquivo | Fase | Prioridade | Status | Dependências | Observações |
|---|---|---|---|---|---|---|---|---|
| UT-PIPE-01 | ZodValidationPipe: payload válido passa sem modificação | Happy path | `zod-validation.pipe.spec.ts` | Fase 1 | P0 | ❌ Ausente | Criar arquivo | Ação 1.1 |
| UT-PIPE-02 | ZodValidationPipe: payload inválido lança BadRequestException com "Validation failed" | Formato de erro | `zod-validation.pipe.spec.ts` | Fase 1 | P0 | ❌ Ausente | Criar arquivo | Ação 1.1 |
| UT-PIPE-03 | ZodValidationPipe: erros por campo em body.errors | Estrutura de erros | `zod-validation.pipe.spec.ts` | Fase 1 | P0 | ❌ Ausente | Criar arquivo | Ação 1.1 |
| UT-PIPE-04 | ZodValidationPipe: múltiplos campos com erro retornados simultaneamente | UX de formulário | `zod-validation.pipe.spec.ts` | Fase 1 | P1 | ❌ Ausente | Criar arquivo | Ação 1.1 |
| UT-PIPE-05 | ZodValidationPipe: price negativo no schema de produto retorna erro descritivo | Validação de negócio | `zod-validation.pipe.spec.ts` | Fase 1 | P1 | ❌ Ausente | Criar arquivo | Ação 1.1 |

### Users

| ID | Título | Objetivo | Arquivo | Fase | Prioridade | Status | Dependências | Observações |
|---|---|---|---|---|---|---|---|---|
| UT-USER-01 | UserRepository: findUserById retorna usuário existente | Happy path | `users.repository.spec.ts` | Existente | P1 | ✅ Existe | — | Manter |
| UT-USER-02 | UserRepository: findUserById retorna null quando não encontrado | Not found | `users.repository.spec.ts` | Existente | P1 | ✅ Existe | — | Manter |
| UT-USER-03 | UserRepository: createUser cria e retorna usuário | Happy path | `users.repository.spec.ts` | Existente | P1 | ✅ Existe | — | Manter |

---

## Unit Tests — Frontend

### Cart Context

| ID | Título | Objetivo | Arquivo | Fase | Prioridade | Status | Dependências | Observações |
|---|---|---|---|---|---|---|---|---|
| UT-CART-01 | cart-context: inicia com carrinho vazio | Estado inicial | `cart-context.spec.tsx` | Fase 2 | P0 | ❌ Ausente | Jest+RTL instalados | |
| UT-CART-02 | cart-context: carrega itens do sessionStorage na inicialização | Persistência ao montar | `cart-context.spec.tsx` | Fase 2 | P0 | ❌ Ausente | Jest+RTL instalados | |
| UT-CART-03 | cart-context: addItem adiciona produto ao carrinho | Operação básica | `cart-context.spec.tsx` | Fase 2 | P0 | ❌ Ausente | Jest+RTL instalados | |
| UT-CART-04 | cart-context: addItem incrementa quantidade de produto já existente | Deduplicação | `cart-context.spec.tsx` | Fase 2 | P0 | ❌ Ausente | Jest+RTL instalados | |
| UT-CART-05 | cart-context: addItem não ultrapassa o stock do produto | Limite de estoque | `cart-context.spec.tsx` | Fase 2 | P0 | ❌ Ausente | Jest+RTL instalados | |
| UT-CART-06 | cart-context: addItem não adiciona produto com stock=0 | Produto indisponível | `cart-context.spec.tsx` | Fase 2 | P0 | ❌ Ausente | Jest+RTL instalados | |
| UT-CART-07 | cart-context: removeItem remove produto pelo productId | Operação básica | `cart-context.spec.tsx` | Fase 2 | P1 | ❌ Ausente | Jest+RTL instalados | |
| UT-CART-08 | cart-context: updateQuantity atualiza quantidade do item | Operação básica | `cart-context.spec.tsx` | Fase 2 | P1 | ❌ Ausente | Jest+RTL instalados | |
| UT-CART-09 | cart-context: updateQuantity com quantidade 0 remove o item | Atalho de remoção | `cart-context.spec.tsx` | Fase 2 | P1 | ❌ Ausente | Jest+RTL instalados | |
| UT-CART-10 | cart-context: clearCart esvazia o carrinho e o sessionStorage | Limpeza pós-checkout | `cart-context.spec.tsx` | Fase 2 | P0 | ❌ Ausente | Jest+RTL instalados | |
| UT-CART-11 | cart-context: persistência — addItem persiste no sessionStorage | Reload survives | `cart-context.spec.tsx` | Fase 2 | P1 | ❌ Ausente | Jest+RTL instalados | |
| UT-CART-12 | cart-context: itemCount correto com múltiplos produtos | Cálculo de badge | `cart-context.spec.tsx` | Fase 2 | P1 | ❌ Ausente | Jest+RTL instalados | |
| UT-CART-13 | cart-context: total monetário calculado corretamente | Cálculo financeiro | `cart-context.spec.tsx` | Fase 2 | P1 | ❌ Ausente | Jest+RTL instalados | |

### Auth Context

| ID | Título | Objetivo | Arquivo | Fase | Prioridade | Status | Dependências | Observações |
|---|---|---|---|---|---|---|---|---|
| UT-AUTH-CTX-01 | auth-context: inicia com user=null e isAuthenticated=false | Estado inicial | `auth-context.spec.tsx` | Fase 2 | P0 | ❌ Ausente | Jest+RTL instalados | |
| UT-AUTH-CTX-02 | auth-context: define user quando sessão retorna autenticado | Sessão ativa | `auth-context.spec.tsx` | Fase 2 | P0 | ❌ Ausente | Jest+RTL instalados | |
| UT-AUTH-CTX-03 | auth-context: mantém user=null quando sessão retorna 401 | Sessão inativa | `auth-context.spec.tsx` | Fase 2 | P0 | ❌ Ausente | Jest+RTL instalados | |
| UT-AUTH-CTX-04 | auth-context: login() define user após sucesso | Login | `auth-context.spec.tsx` | Fase 2 | P0 | ❌ Ausente | Jest+RTL instalados | |
| UT-AUTH-CTX-05 | auth-context: login() lança erro com credenciais inválidas | Login com erro | `auth-context.spec.tsx` | Fase 2 | P0 | ❌ Ausente | Jest+RTL instalados | |
| UT-AUTH-CTX-06 | auth-context: logout() limpa user e chama DELETE /api/auth/session | Logout | `auth-context.spec.tsx` | Fase 2 | P0 | ❌ Ausente | Jest+RTL instalados | |

### Componentes

| ID | Título | Objetivo | Arquivo | Fase | Prioridade | Status | Dependências | Observações |
|---|---|---|---|---|---|---|---|---|
| UT-COMP-01 | ProductCard: renderiza nome e preço | Renderização básica | `product-card.spec.tsx` | Fase 2 | P1 | ❌ Ausente | Jest+RTL instalados | |
| UT-COMP-02 | ProductCard: badge "Esgotado" visível quando stock=0 | Estado de indisponibilidade | `product-card.spec.tsx` | Fase 2 | P1 | ❌ Ausente | Jest+RTL instalados | |
| UT-COMP-03 | ProductCard: botão "Adicionar" desabilitado quando stock=0 | UX de produto indisponível | `product-card.spec.tsx` | Fase 2 | P1 | ❌ Ausente | Jest+RTL instalados | |
| UT-COMP-04 | ProductCard: chama onAddToCart ao clicar no botão | Interação | `product-card.spec.tsx` | Fase 2 | P1 | ❌ Ausente | Jest+RTL instalados | |
| UT-COMP-05 | Pagination: botão "Anterior" desabilitado na página 1 | Edge case de paginação | `pagination.spec.tsx` | Fase 2 | P2 | ❌ Ausente | Jest+RTL instalados | |
| UT-COMP-06 | Pagination: botão "Próximo" desabilitado na última página | Edge case de paginação | `pagination.spec.tsx` | Fase 2 | P2 | ❌ Ausente | Jest+RTL instalados | |
| UT-COMP-07 | Pagination: chama onPageChange com número correto | Interação | `pagination.spec.tsx` | Fase 2 | P2 | ❌ Ausente | Jest+RTL instalados | |

### API Layer

| ID | Título | Objetivo | Arquivo | Fase | Prioridade | Status | Dependências | Observações |
|---|---|---|---|---|---|---|---|---|
| UT-API-01 | products API: getProducts usa `api` (não bffApi) | BFF pattern correto | `lib/api/products.spec.ts` | Fase 2 | P1 | ❌ Ausente | Jest+RTL instalados | |
| UT-API-02 | products API: getProductById usa `api` | BFF pattern correto | `lib/api/products.spec.ts` | Fase 2 | P1 | ❌ Ausente | Jest+RTL instalados | |
| UT-API-03 | products API: createProduct usa `bffApi` | Requisição autenticada | `lib/api/products.spec.ts` | Fase 2 | P1 | ❌ Ausente | Jest+RTL instalados | |
| UT-API-04 | products API: deleteProduct usa `bffApi` | Requisição autenticada | `lib/api/products.spec.ts` | Fase 2 | P1 | ❌ Ausente | Jest+RTL instalados | |
| UT-API-05 | products API: getProducts monta query string com todos os filtros | Params corretos | `lib/api/products.spec.ts` | Fase 2 | P2 | ❌ Ausente | Jest+RTL instalados | |

---

## Testes de Integração — Backend E2E

### Auth

| ID | Título | Objetivo | Arquivo | Fase | Prioridade | Status | Dependências | Observações |
|---|---|---|---|---|---|---|---|---|
| INT-AUTH-01 | POST /auth/register — 201 com shape correto | Happy path + contrato | `auth.e2e-spec.ts` | Existente + Fase 2 | P0 | ✅ Existe | + schema Zod na Fase 2 | Adicionar schema assertion |
| INT-AUTH-02 | POST /auth/register — 409 email duplicado | Unicidade | `auth.e2e-spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| INT-AUTH-03 | POST /auth/register — 400 payload inválido | Validação | `auth.e2e-spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| INT-AUTH-04 | POST /auth/login — 200 com token e user | Happy path + contrato | `auth.e2e-spec.ts` | Existente + Fase 0+2 | P0 | ⚠️ Existe (hash suspeito) | Corrigir hash (Fase 0) + schema (Fase 2) | |
| INT-AUTH-05 | POST /auth/login — 401 senha errada | Segurança | `auth.e2e-spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| INT-AUTH-06 | POST /auth/login — 401 usuário inexistente | Segurança | `auth.e2e-spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| INT-AUTH-07 | GET /auth/me — 401 sem token | JWT ausente | `rbac-errors.e2e-spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| INT-AUTH-08 | GET /auth/me — 401 token inválido | JWT malformado | `rbac-errors.e2e-spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| INT-AUTH-09 | GET /auth/me — 401 token expirado | JWT expirado | `rbac-errors.e2e-spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| INT-AUTH-10 | GET /auth/admin-test — 403 para customer | RBAC | `rbac-errors.e2e-spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| INT-AUTH-11 | GET /auth/admin-test — 200 para admin | RBAC | `rbac-errors.e2e-spec.ts` | Existente | P0 | ✅ Existe | — | Manter |

### Products

| ID | Título | Objetivo | Arquivo | Fase | Prioridade | Status | Dependências | Observações |
|---|---|---|---|---|---|---|---|---|
| INT-PROD-01 | POST /products — 201 admin + shape correto | Happy path + contrato | `products.e2e-spec.ts` | Existente + Fase 2 | P0 | ✅ Existe | + schema (Fase 2) | |
| INT-PROD-02 | POST /products — 400 payload inválido com erros por campo | Validação Zod | `products.e2e-spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| INT-PROD-03 | POST /products — 403 token customer | RBAC | `products.e2e-spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| INT-PROD-04 | PUT /products/:id — 200 admin + produto atualizado | Atualização | `products.e2e-spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| INT-PROD-05 | DELETE /products/:id — 204 + produto removido do banco | Remoção | `products.e2e-spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| INT-PROD-06 | GET /products — 200 com paginação e shape correto | Listagem pública + contrato | `products.e2e-spec.ts` | Fase 2 | P1 | ❌ Ausente | Criar caso | |
| INT-PROD-07 | GET /products?search=x — retorna apenas produtos correspondentes | Busca | `products.e2e-spec.ts` | Fase 2 | P1 | ❌ Ausente | Criar caso | |

### Orders

| ID | Título | Objetivo | Arquivo | Fase | Prioridade | Status | Dependências | Observações |
|---|---|---|---|---|---|---|---|---|
| INT-ORD-01 | POST /orders — 201 customer + items válidos + shape correto | Happy path + contrato | `orders.e2e-spec.ts` | Fase 1 | P0 | ❌ Ausente | Criar arquivo (Fase 1) | Ação 1.3 |
| INT-ORD-02 | POST /orders — estoque decrementado após criação | Atomicidade | `orders.e2e-spec.ts` | Fase 1 | P0 | ❌ Ausente | Criar arquivo (Fase 1) | |
| INT-ORD-03 | POST /orders — snapshot: unitPrice e productName corretos | Integridade histórica | `orders.e2e-spec.ts` | Fase 1 | P0 | ❌ Ausente | Criar arquivo (Fase 1) | |
| INT-ORD-04 | POST /orders — 400/INSUFFICIENT_STOCK com details | Controle de estoque | `orders.e2e-spec.ts` | Fase 1 | P0 | ❌ Ausente | Criar arquivo (Fase 1) | |
| INT-ORD-05 | POST /orders — 400 productId inexistente | Produto inválido | `orders.e2e-spec.ts` | Fase 1 | P0 | ❌ Ausente | Criar arquivo (Fase 1) | |
| INT-ORD-06 | POST /orders — 403 admin tentando criar pedido | RBAC | `orders.e2e-spec.ts` | Fase 1 | P0 | ❌ Ausente | Criar arquivo (Fase 1) | |
| INT-ORD-07 | POST /orders — 401 sem token | JWT ausente | `orders.e2e-spec.ts` | Fase 1 | P0 | ❌ Ausente | Criar arquivo (Fase 1) | |
| INT-ORD-08 | GET /orders — admin vê todos os pedidos com user info | Visão admin | `orders.e2e-spec.ts` | Fase 1 | P0 | ❌ Ausente | Criar arquivo (Fase 1) | |
| INT-ORD-09 | GET /orders — customer vê apenas os seus pedidos | Isolamento de dados | `orders.e2e-spec.ts` | Fase 1 | P0 | ❌ Ausente | Criar arquivo (Fase 1) | |
| INT-ORD-10 | GET /orders — 401 sem token | JWT ausente | `orders.e2e-spec.ts` | Fase 1 | P1 | ❌ Ausente | Criar arquivo (Fase 1) | |
| INT-ORD-11 | PATCH /orders/:id/status — 200 admin + status atualizado | Gestão de pedidos | `orders.e2e-spec.ts` | Fase 1 | P0 | ❌ Ausente | Criar arquivo (Fase 1) | |
| INT-ORD-12 | PATCH /orders/:id/status — 403 customer | RBAC | `orders.e2e-spec.ts` | Fase 1 | P0 | ❌ Ausente | Criar arquivo (Fase 1) | |
| INT-ORD-13 | PATCH /orders/:id/status — 404 ID inválido | Recurso inexistente | `orders.e2e-spec.ts` | Fase 1 | P1 | ❌ Ausente | Criar arquivo (Fase 1) | |
| INT-ORD-14 | POST /orders — race condition: apenas 1 de 2 requests simultâneos com stock=1 sucede | Atomicidade sob concorrência | `orders-concurrency.e2e-spec.ts` | Fase 3 | P1 | ❌ Ausente | Criar arquivo (Fase 3) | Ação 3.4 |

---

## E2E Tests — Playwright (Frontend)

### Auth

| ID | Título | Objetivo | Arquivo | Fase | Prioridade | Status | Dependências | Observações |
|---|---|---|---|---|---|---|---|---|
| E2E-AUTH-01 | Login como ADMIN → redirect /admin + toast sucesso | Happy path admin | `auth.spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| E2E-AUTH-02 | Login com credenciais inválidas → erro visível | Feedback de erro | `auth.spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| E2E-AUTH-03 | Usuário autenticado tentando /login → redirect / | Proteção de rota | `auth.spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| E2E-AUTH-04 | Navegação entre login e register | UX básica | `auth.spec.ts` | Existente | P2 | ✅ Existe | — | Manter |
| E2E-AUTH-05 | Logout → DELETE session + redirect /login | Segurança de sessão | `auth.spec.ts` | Fase 1 | P0 | ❌ Ausente | Ação 1.6 | |
| E2E-AUTH-06 | Logout de admin → redirect /login | Segurança admin | `auth.spec.ts` | Fase 1 | P0 | ❌ Ausente | Ação 1.6 | |

### Register

| ID | Título | Objetivo | Arquivo | Fase | Prioridade | Status | Dependências | Observações |
|---|---|---|---|---|---|---|---|---|
| E2E-REG-01 | Cadastro com dados válidos → sucesso | Happy path | `register.spec.ts` | Existente | P0 | ⚠️ Precisa verificar | — | Verificar conteúdo atual |
| E2E-REG-02 | Submit sem campos → erros de validação inline | UX de validação | `register.spec.ts` | Fase 1 | P1 | ❌ Ausente | Ação 1.7 | |
| E2E-REG-03 | Email inválido → mensagem de formato | Validação client-side | `register.spec.ts` | Fase 1 | P1 | ❌ Ausente | Ação 1.7 | |
| E2E-REG-04 | Senha muito curta → mensagem de comprimento | Validação client-side | `register.spec.ts` | Fase 1 | P1 | ❌ Ausente | Ação 1.7 | |
| E2E-REG-05 | Email já cadastrado → mensagem de conflito 409 | Feedback de erro server | `register.spec.ts` | Fase 1 | P1 | ❌ Ausente | Ação 1.7 | |

### RBAC

| ID | Título | Objetivo | Arquivo | Fase | Prioridade | Status | Dependências | Observações |
|---|---|---|---|---|---|---|---|---|
| E2E-RBAC-01 | Unauthenticated → /orders redireciona /login | Proteção de rota | `rbac.spec.ts` | Fase 0 fixme | P0 | ⚠️ fixme | Corrigir fixme (Fase 0) | |
| E2E-RBAC-02 | Unauthenticated → /admin/products redireciona /login | Proteção admin | `rbac.spec.ts` | Fase 0 fixme | P0 | ⚠️ fixme | Corrigir fixme (Fase 0) | |
| E2E-RBAC-03 | CUSTOMER → /admin/products redireciona / | RBAC customer | `rbac.spec.ts` | Fase 0 fixme | P0 | ⚠️ fixme | Corrigir fixme (Fase 0) | |
| E2E-RBAC-04 | ADMIN → /admin/products acessível | RBAC admin | `rbac.spec.ts` | Fase 0 fixme | P0 | ⚠️ fixme | Corrigir fixme (Fase 0) | |
| E2E-RBAC-05 | Authenticated (any role) → /profile acessível | Rota mista | `rbac.spec.ts` | Fase 0 fixme | P1 | ⚠️ fixme | Corrigir fixme (Fase 0) | |

### Catálogo

| ID | Título | Objetivo | Arquivo | Fase | Prioridade | Status | Dependências | Observações |
|---|---|---|---|---|---|---|---|---|
| E2E-CAT-01 | ?search=x → campo pré-preenchido + lista filtrada | Busca por URL | `catalog.spec.ts` | Fase 0 fixme | P1 | ⚠️ fixme | Corrigir fixme (Fase 0) | |
| E2E-CAT-02 | Busca sem resultados → empty state | UX de empty state | `catalog.spec.ts` | Fase 0 fixme | P1 | ⚠️ fixme | Corrigir fixme (Fase 0) | |
| E2E-CAT-03 | Clicar em produto → navega para /products/:id | Navegação | `catalog.spec.ts` | Fase 0 fixme | P1 | ⚠️ fixme | Corrigir fixme (Fase 0) | |
| E2E-CAT-04 | Filtro por categoria → apenas produtos da categoria | Filtro UI | `catalog.spec.ts` | Fase 3 | P1 | ❌ Ausente | Ação 3.2 | |
| E2E-CAT-05 | search + category combinados | Filtros combinados | `catalog.spec.ts` | Fase 3 | P2 | ❌ Ausente | Ação 3.2 | |
| E2E-CAT-06 | Limpar filtros → catálogo completo | UX de filtros | `catalog.spec.ts` | Fase 3 | P2 | ❌ Ausente | Ação 3.2 | |
| E2E-CAT-07 | Paginação → clicar em próxima página carrega página 2 | Navegação de páginas | `catalog.spec.ts` | Fase 3 | P2 | ❌ Ausente | Ação 3.2 | |

### Detalhe de Produto

| ID | Título | Objetivo | Arquivo | Fase | Prioridade | Status | Dependências | Observações |
|---|---|---|---|---|---|---|---|---|
| E2E-DET-01 | Produto disponível exibe conteúdo e botão habilitado | Happy path | `product-details.spec.ts` | Fase 3 | P1 | ⚠️ Precisa verificar | — | Verificar conteúdo atual |
| E2E-DET-02 | Produto com stock=0 → badge esgotado + botão desabilitado | Produto indisponível | `product-details.spec.ts` | Fase 3 | P1 | ❌ Ausente | Ação 3.1 | |
| E2E-DET-03 | Produto inexistente → página de erro ou redirect | Not found | `product-details.spec.ts` | Fase 3 | P2 | ❌ Ausente | Ação 3.1 | |
| E2E-DET-04 | Adicionar ao carrinho a partir da detalhe → badge atualizado | Integração com carrinho | `product-details.spec.ts` | Fase 3 | P1 | ❌ Ausente | Ação 3.1 | |

### Orders (Customer)

| ID | Título | Objetivo | Arquivo | Fase | Prioridade | Status | Dependências | Observações |
|---|---|---|---|---|---|---|---|---|
| E2E-ORD-01 | Fluxo completo: catálogo → carrinho → checkout → pedido criado | Happy path de compra | `orders.spec.ts` | Fase 0 fixme | P0 | ⚠️ fixme | Corrigir fixme (Fase 0) | |
| E2E-ORD-02 | Carrinho persiste após reload (sessionStorage) | Persistência | `orders.spec.ts` | Fase 0 fixme | P1 | ⚠️ fixme | Corrigir fixme (Fase 0) | |
| E2E-ORD-03 | Stock reduzido ao abrir carrinho → quantidade auto-ajustada | Race condition UX | `orders.spec.ts` | Fase 0 fixme | P1 | ⚠️ fixme | Corrigir fixme (Fase 0) | |
| E2E-ORD-04 | INSUFFICIENT_STOCK ao finalizar → toast erro, sem navegação | Erro de checkout | `orders.spec.ts` | Fase 0 fixme | P0 | ⚠️ fixme | Corrigir fixme (Fase 0) | |
| E2E-ORD-05 | /orders sem login → redirect /login | Proteção de rota | `orders.spec.ts` | Existente | P0 | ✅ Existe | — | Manter |
| E2E-ORD-06 | /orders sem pedidos → empty state | UX | `orders.spec.ts` | Fase 3 | P1 | ❌ Ausente | Ação 3.3 | |
| E2E-ORD-07 | Card de pedido exibe itens, nome e valor | Conteúdo do card | `orders.spec.ts` | Fase 3 | P1 | ❌ Ausente | Ação 3.3 | |

### Admin — Produtos

| ID | Título | Objetivo | Arquivo | Fase | Prioridade | Status | Dependências | Observações |
|---|---|---|---|---|---|---|---|---|
| E2E-ADM-PROD-01 | Criar produto → toast de sucesso | CRUD admin | `admin-products.spec.ts` | Fase 1 | P0 | ❌ Ausente | Ação 1.4 | |
| E2E-ADM-PROD-02 | Criar produto com campos inválidos → erros de validação | Validação de formulário | `admin-products.spec.ts` | Fase 1 | P1 | ❌ Ausente | Ação 1.4 | |
| E2E-ADM-PROD-03 | Editar produto → modal pré-preenchido | UX de edição | `admin-products.spec.ts` | Fase 1 | P1 | ❌ Ausente | Ação 1.4 | |
| E2E-ADM-PROD-04 | Editar produto → toast de sucesso | CRUD admin | `admin-products.spec.ts` | Fase 1 | P0 | ❌ Ausente | Ação 1.4 | |
| E2E-ADM-PROD-05 | Excluir produto → dialog de confirmação | UX de ação destrutiva | `admin-products.spec.ts` | Fase 1 | P1 | ❌ Ausente | Ação 1.4 | |
| E2E-ADM-PROD-06 | Confirmar exclusão → toast de sucesso | CRUD admin | `admin-products.spec.ts` | Fase 1 | P0 | ❌ Ausente | Ação 1.4 | |
| E2E-ADM-PROD-07 | Cancelar exclusão → produto mantido | Operação destrutiva cancelada | `admin-products.spec.ts` | Fase 1 | P1 | ❌ Ausente | Ação 1.4 | |

### Admin — Orders

| ID | Título | Objetivo | Arquivo | Fase | Prioridade | Status | Dependências | Observações |
|---|---|---|---|---|---|---|---|---|
| E2E-ADM-ORD-01 | Admin vê todos os pedidos com email do cliente | Visão administrativa | `admin-orders.spec.ts` | Fase 1 | P0 | ❌ Ausente | Ação 1.5 | |
| E2E-ADM-ORD-02 | Admin sem pedidos → empty state | UX | `admin-orders.spec.ts` | Fase 1 | P2 | ❌ Ausente | Ação 1.5 | |
| E2E-ADM-ORD-03 | Admin atualiza status PENDING → COMPLETED | Gestão de ciclo de vida | `admin-orders.spec.ts` | Fase 1 | P0 | ❌ Ausente | Ação 1.5 | |
| E2E-ADM-ORD-04 | Admin atualiza status PENDING → CANCELLED | Gestão de ciclo de vida | `admin-orders.spec.ts` | Fase 1 | P1 | ❌ Ausente | Ação 1.5 | |
| E2E-ADM-ORD-05 | Customer tentando /admin/orders → redirect / | RBAC | `admin-orders.spec.ts` | Fase 1 | P0 | ❌ Ausente | Ação 1.5 | |

---

## Resumo por Status

| Status | Count |
|---|---|
| ✅ Existe e deve ser mantido | ~35 casos |
| ⚠️ Existe mas precisa correção (fixme, hash, stub) | ~12 casos |
| ❌ Ausente — a criar | ~55 casos |

**Total alvo ao final das 4 fases:** ~100 casos de teste cobrindo as 3 camadas.
