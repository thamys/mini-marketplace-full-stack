# Fase 3 — E2E Completo e Cenários Avançados

## Objetivo

Completar a cobertura E2E com os cenários restantes — edge cases de negócio, fluxos não cobertos pelas fases anteriores e cenários de concorrência/race condition que só podem ser testados no nível de integração com banco real. Esta fase também introduz um smoke test opcional para validação de integração real (sem mocks).

**Duração estimada:** 2–3 dias
**Prioridade:** Média
**Pré-requisito:** Fases 0, 1 e 2 concluídas
**Risco:** Baixo para E2E Playwright; Médio para o teste de concorrência (requer cuidado com isolamento de banco)

---

## Ação 3.1 — Expandir `product-details.spec.ts`

**Arquivo:** `frontend/e2e/product-details.spec.ts`

**Motivação:** A página de detalhe de produto é o último ponto de decisão antes da compra. Estados críticos (produto esgotado, produto inexistente) não estão cobertos.

**Verificar o estado atual do arquivo** antes de escrever novos casos (leitura recomendada para não duplicar o que já existe).

**Casos a adicionar:**

```typescript
test.describe('Product Details Page', () => {
  test('TC-DET-01: Produto disponível exibe nome, preço, descrição e botão de adicionar ao carrinho habilitado', async ({ page }) => {
    // Mock GET /api/products/:id → produto com stock=5
    // Navegar para /products/prod-1
    // Assert: h1 contém nome do produto
    // Assert: preço formatado visível
    // Assert: descrição visível
    // Assert: botão "Adicionar ao carrinho" habilitado
  });

  test('TC-DET-02: Produto com stock=0 exibe badge "Esgotado" e botão desabilitado', async ({ page }) => {
    // Mock GET /api/products/:id → produto com stock=0
    // Assert: badge ou texto "Esgotado"/"Indisponível" visível
    // Assert: botão de adicionar ao carrinho desabilitado
  });

  test('TC-DET-03: Produto inexistente exibe página de erro ou redirect', async ({ page }) => {
    // Mock GET /api/products/id-invalido → 404
    // Assert: página de erro ou redirect para /
    // (verificar comportamento real da página — pode ser notFound() do Next.js ou redirect)
  });

  test('TC-DET-04: Adicionar produto ao carrinho a partir da página de detalhe atualiza badge', async ({ page }) => {
    // Setup: sessão autenticada ou anônima (verificar se carrinho funciona sem login)
    // Mock GET /api/products/:id → produto com stock=5
    // Clicar no botão "Adicionar ao carrinho"
    // Assert: badge do carrinho no header mostra "1"
  });

  test('TC-DET-05: Estado de loading exibe skeleton durante carregamento', async ({ page }) => {
    // Configurar mock com delay artificial (via route abort timeout)
    // Assert: skeleton de produto visível antes da resposta
    // Assert: conteúdo real visível após resposta
    // Nota: este teste pode ser frágil — implementar com cuidado ou pular se o
    // skeleton desaparecer muito rápido para ser capturado com certeza
  });
});
```

**Critérios de Aceite:**
- [ ] TC-DET-01: happy path completo da página de detalhe
- [ ] TC-DET-02: estado de produto esgotado — badge e botão desabilitado
- [ ] TC-DET-03: comportamento para produto inexistente documentado e testado
- [ ] TC-DET-04: integração com carrinho a partir da página de detalhe
- [ ] TC-DET-05: implementado apenas se o skeleton for capturável de forma confiável (não usar `waitForTimeout`)
- [ ] Seletores baseados em `data-testid`; confirmados contra o código real da página
- [ ] `pnpm --filter frontend test:e2e` passa sem falhas

---

## Ação 3.2 — Expandir `catalog.spec.ts` com filtros e paginação

**Arquivo:** `frontend/e2e/catalog.spec.ts`

**Motivação:** Após corrigir os `fixme` na Fase 0, o catálogo tem apenas 3 casos. Filtro por categoria e paginação são funcionalidades visíveis ao usuário que precisam de cobertura E2E.

**Casos a adicionar:**

```typescript
test('TC-CAT-04: Filtro por categoria exibe apenas produtos da categoria selecionada', async ({ page }) => {
  // Mock: quando URL inclui ?category=eletronicos → retorna apenas produtos da categoria
  // Interagir com o seletor de categoria (data-testid="category-filter" ou similar)
  // Selecionar uma categoria
  // Assert: URL contém ?category=<categoria>
  // Assert: produtos exibidos correspondem à categoria selecionada
  // Assert: URL atualizada (search params sincronizados)
});

test('TC-CAT-05: Combinação de search + category funciona corretamente', async ({ page }) => {
  // Mock: quando URL inclui search=notebook&category=eletronicos → retorna resultado filtrado
  // Preencher campo de busca e selecionar categoria
  // Assert: URL contém ambos os parâmetros
  // Assert: resultado exibido corresponde à combinação dos filtros
});

test('TC-CAT-06: Limpar filtros retorna catálogo completo', async ({ page }) => {
  // Navegar com ?search=notebook&category=eletronicos
  // Clicar em "Limpar filtros" ou apagar o campo de busca
  // Assert: URL sem parâmetros de filtro
  // Assert: catálogo completo exibido
});

test('TC-CAT-07: Paginação — clicar em próxima página carrega página 2', async ({ page }) => {
  // Mock: página 1 com meta.totalPages=3
  // Mock: quando URL inclui ?page=2 → retorna produtos da página 2
  // Clicar no botão "Próxima" ou número 2
  // Assert: URL contém ?page=2
  // Assert: produtos da página 2 exibidos
});

test('TC-CAT-08: Paginação — URL com ?page=2 carrega a página correta diretamente', async ({ page }) => {
  // Mock: quando page=2 → retorna produtos corretos
  // Navegar diretamente para /?page=2
  // Assert: produtos da página 2 visíveis sem interação adicional
});
```

**Critérios de Aceite:**
- [ ] 5 novos casos cobrindo filtro por categoria, combinação de filtros, limpeza e paginação
- [ ] Verificar quais `data-testid` existem nos componentes `search-filters.tsx` e `pagination.tsx` antes de escrever os seletores
- [ ] Mocks de rota respondem de forma diferente baseado nos query params da URL (`new URL(route.request().url()).searchParams`)
- [ ] Nenhum `waitForTimeout` — usar `waitForURL` ou assertion com retry
- [ ] `pnpm --filter frontend test:e2e` passa sem falhas

---

## Ação 3.3 — Expandir `orders.spec.ts` com edge cases

**Arquivo:** `frontend/e2e/orders.spec.ts`

**Motivação:** Após corrigir os `fixme` na Fase 0, o arquivo cobre 5 cenários. Adicionar os edge cases restantes: cancelamento, empty state.

**Casos a adicionar:**

```typescript
test('TC-ORD-06: /orders com usuário sem pedidos exibe empty state', async ({ page }) => {
  await setupCustomerSession(page);

  // Mock GET /api/proxy/orders → []
  await page.route('**/api/proxy/orders', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    }
  });

  await page.goto('/orders', { waitUntil: 'domcontentloaded' });

  // Assert: mensagem de "nenhum pedido" visível
  await expect(page.locator('text=Nenhum pedido')).toBeVisible({ timeout: 5000 });
  // Assert: nenhum order-card
  await expect(page.getByTestId('order-card')).toHaveCount(0);
});

test('TC-ORD-07: Pedido exibe itens com nome e valor unitário', async ({ page }) => {
  await setupCustomerSession(page);

  await page.route('**/api/proxy/orders', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, body: JSON.stringify([MOCK_ORDER]) });
    }
  });

  await page.goto('/orders', { waitUntil: 'domcontentloaded' });

  const orderCard = page.getByTestId('order-card').first();
  await expect(orderCard).toBeVisible({ timeout: 5000 });
  // Assert: nome do item visível no card
  await expect(orderCard).toContainText(MOCK_ORDER.items[0].productName);
  // Assert: valor total visível
  await expect(orderCard).toContainText('R$');
});

test('TC-ORD-08: Estado de loading exibe skeleton antes dos pedidos carregarem', async ({ page }) => {
  await setupCustomerSession(page);

  // Configurar mock com delay (se implementável de forma confiável)
  // Assert: skeleton visível inicialmente
  // Assert: pedidos visíveis após carregamento
  // Nota: implementar apenas se o skeleton for capturável — não usar waitForTimeout
});
```

**Critérios de Aceite:**
- [ ] TC-ORD-06: empty state validado (mensagem e ausência de cards)
- [ ] TC-ORD-07: conteúdo do card de pedido validado (nome do item, valor total)
- [ ] Importa `MOCK_ORDER` de `fixtures/index.ts` (não redefine localmente)
- [ ] `pnpm --filter frontend test:e2e` passa sem falhas

---

## Ação 3.4 — Teste de concorrência de estoque no backend

**Arquivo a criar:** `backend/test/orders-concurrency.e2e-spec.ts`

**Motivação:** O maior risco de negócio é o oversell — dois clientes comprando o último item simultaneamente. O `OrdersService` usa `$transaction` do Prisma para atomicidade, mas isso precisa ser verificado sob condições de concorrência real.

**Implementação:**

```typescript
describe('Orders — Race Condition (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeAll(async () => {
    // Bootstrap AppModule
  });

  afterAll(async () => {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await app.close();
  });

  describe('TC-RACE-01: Dois requests simultâneos para produto com stock=1', () => {
    it('apenas um pedido é criado — o segundo recebe 400/INSUFFICIENT_STOCK', async () => {
      // Arrange: criar produto com stock=1
      const product = await prisma.product.create({
        data: { name: 'Race Product', description: 'Test', price: 100, category: 'test', stock: 1 },
      });

      // Gerar dois tokens de customer diferentes
      const token1 = jwtService.sign({ sub: 'user-race-1', email: 'race1@test.com', role: Role.CUSTOMER });
      const token2 = jwtService.sign({ sub: 'user-race-2', email: 'race2@test.com', role: Role.CUSTOMER });

      const payload = { items: [{ productId: product.id, quantity: 1 }] };

      // Act: disparar ambos os requests SIMULTANEAMENTE
      const [res1, res2] = await Promise.all([
        request(app.getHttpServer()).post('/orders').set('Authorization', `Bearer ${token1}`).send(payload),
        request(app.getHttpServer()).post('/orders').set('Authorization', `Bearer ${token2}`).send(payload),
      ]);

      const statuses = [res1.status, res2.status].sort();

      // Assert: exatamente um 201 e um 400
      expect(statuses).toEqual([201, 400]);

      // Assert: estoque final é 0 (não negativo)
      const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
      expect(updatedProduct!.stock).toBe(0);

      // Assert: exatamente 1 pedido criado para este produto
      const orders = await prisma.order.findMany({
        where: { items: { some: { productId: product.id } } },
        include: { items: true },
      });
      expect(orders.length).toBe(1);
    });
  });

  describe('TC-RACE-02: Dois requests simultâneos para produto com stock=2, cada um pedindo 2', () => {
    it('apenas um pedido é criado — o segundo recebe INSUFFICIENT_STOCK', async () => {
      // Similar ao TC-RACE-01 mas stock=2, quantity=2 para cada request
      // Assert: statuses = [201, 400]
      // Assert: stock final = 0
    });
  });

  describe('TC-RACE-03: Dois requests para produtos diferentes não interferem entre si', () => {
    it('ambos os pedidos são criados com sucesso quando produtos são diferentes', async () => {
      // Arrange: dois produtos com stock=1 cada
      // Act: request 1 compra produto A, request 2 compra produto B (simultâneo)
      // Assert: ambos retornam 201
      // Assert: stock de A = 0, stock de B = 0
    });
  });
});
```

**Considerações Importantes:**
- Este teste requer banco de dados real — não funciona com mocks
- A Prisma `$transaction` com `serializable isolation` (ou `READ COMMITTED` padrão do Postgres) pode ou não prevenir o race condition dependendo do nível de isolamento
- **Hipótese:** O comportamento atual pode permitir oversell sob alta carga real, pois a validação de estoque (leitura) e a atualização (escrita) não estão em uma query atômica de banco com `SELECT FOR UPDATE`. Verificar o comportamento real do Prisma `$transaction` para decidir se um teste de concorrência com `Promise.all` de apenas 2 requests é suficiente ou se precisaria de load test.
- Se o banco permitir oversell, documentar como bug para futura correção (ex: usar `UPDATE ... WHERE stock >= quantity`)

**Critérios de Aceite:**
- [ ] TC-RACE-01: dos dois requests simultâneos, exatamente 1 sucede (201) e 1 falha (400)
- [ ] TC-RACE-01: estoque final validado diretamente no banco — não pode ser negativo
- [ ] TC-RACE-01: número de pedidos criados para o produto validado diretamente no banco
- [ ] TC-RACE-02: comportamento idêntico com stock=2 e quantity=2
- [ ] TC-RACE-03: independência entre produtos confirmada
- [ ] Se o teste de concorrência revelar oversell possível, o resultado é documentado como issue no backlog — **não falhar silenciosamente**
- [ ] `pnpm test:e2e --testPathPattern="concurrency"` executa de forma isolada

---

## Ação 3.5 — Smoke Test de integração real (opcional)

**Arquivo a criar:** `frontend/e2e/smoke.spec.ts`

**Motivação:** Todos os testes E2E atuais usam mocks de rota. Um smoke test sem mocks valida que o frontend, o backend e o banco realmente se comunicam corretamente em ambiente de staging ou local com tudo rodando.

**Quando usar:** Somente em pipelines de nightly/release ou com backend real disponível. **Não deve rodar em PRs** (requer infraestrutura completa, é lento, e é mais frágil por depender de dados reais).

**Implementação:**

```typescript
// smoke.spec.ts — SEM mocks de rota. Requer backend + banco rodando.
import { test, expect } from '@playwright/test';

const SMOKE_BASE_URL = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';

test.describe('Smoke Test — Integração Real', () => {
  // Verificar se deve rodar (variável de ambiente)
  test.skip(!process.env.RUN_SMOKE_TESTS, 'Smoke tests skipped. Set RUN_SMOKE_TESTS=1 to run.');

  test('SMOKE-01: Aplicação carrega e exibe catálogo de produtos reais', async ({ page }) => {
    await page.goto(SMOKE_BASE_URL, { waitUntil: 'networkidle' });
    // Assert: página carregou sem erro 500
    await expect(page).not.toHaveURL(/error/);
    // Assert: estrutura básica visível (header, área de produtos)
    await expect(page.locator('header')).toBeVisible();
  });

  test('SMOKE-02: Login com usuário de seed funciona', async ({ page }) => {
    // Usar credenciais do seed (admin@marketplace.com / Admin@123 ou similar)
    // Assert: login bem-sucedido
    // Assert: redirect para /admin
  });

  test('SMOKE-03: Admin consegue listar produtos reais', async ({ page }) => {
    // Após login como admin
    // Assert: tabela de produtos visível com dados reais
  });
});
```

**Critérios de Aceite:**
- [ ] Smoke tests são **pulados por padrão** — só rodam quando `RUN_SMOKE_TESTS=1`
- [ ] Smoke tests **não** interferem com a suite de mocks (workers e contexto separados se necessário)
- [ ] Documentado no CI em qual job/pipeline devem rodar (nightly — ver Fase 4)
- [ ] Usa credenciais do seed do projeto — documentar quais são em `e2e/helpers/smoke-credentials.ts` ou `.env.test`

---

## Validação Final da Fase 3

```bash
# 1. Frontend: E2E completo (todos os specs, incluindo novos)
cd frontend && pnpm test:e2e
# Resultado esperado: ~55+ testes passando, 0 falhas

# 2. Backend: concorrência (isolado)
cd backend && pnpm test:e2e --testPathPattern="concurrency"
# Resultado esperado: 3 testes passando (ou documentação de bug se oversell for possível)

# 3. Verificar relatório Playwright para ausência de waitForTimeout
grep -r "waitForTimeout" frontend/e2e/
# Resultado esperado: 0 ocorrências (ou apenas em smoke.spec.ts com justificativa)

# 4. Smoke test (apenas quando backend está rodando localmente)
cd frontend && RUN_SMOKE_TESTS=1 pnpm test:e2e --grep "Smoke"
```

**Critério de saída da Fase 3:**
- [ ] `product-details.spec.ts` cobre produto esgotado e produto inexistente
- [ ] `catalog.spec.ts` cobre filtro por categoria, combinação de filtros e paginação
- [ ] `orders.spec.ts` cobre empty state e conteúdo do card de pedido
- [ ] `orders-concurrency.e2e-spec.ts` existe e documenta comportamento sob concorrência
- [ ] Zero `waitForTimeout` em toda a suite de E2E
- [ ] Smoke test criado e pulado por padrão
- [ ] Relatório HTML do Playwright gerado sem falhas em todos os testes não-smoke
