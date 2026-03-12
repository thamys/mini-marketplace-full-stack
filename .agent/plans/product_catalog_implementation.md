# Product Catalog (US-08)

This plan outlines the implementation of a public product catalog (Issues #32-37). It includes backend data modeling, API development with filters and pagination, and a responsive frontend catalog interface.

## User Review Required

> [!NOTE]
> The issues mention "Teste E2E de busca passa no Cypress" but the project rules (`testing_requirements.md`) explicitly mandate Playwright for E2E tests (`frontend/e2e/*.spec.ts`). I plan to use **Playwright** to respect the global testing requirements. Let me know if you prefer Cypress overriding the standard rule.

> [!TIP]
> Since `frontend/app/page.tsx` is still using Next.js boilerplate, I will repurpose it as the main catalog page (`/`), rather than creating a nested `/products` route.

## Proposed Changes

### Backend Infrastructure

#### [MODIFY] backend/prisma/schema.prisma

Add the `Product` model:

- `id` (uuid, @id, @default(uuid()))
- `name` (String)
- `description` (String)
- `price` (Decimal)
- `category` (String)
- `stock` (Int)
- `imageUrl` (String?) - Para imagem, no seed use o `https://placehold.co/600x400?text=[name-do-produto]`
- `createdAt` (DateTime @default(now()))

---

### Backend Application Layer

#### [NEW] backend/src/products/dto/get-products.dto.ts

Create Zod schemas for query parameters (`search`, `category`, `page`, `limit`) to enforce validation as per project rules. The `limit` parameter should default to 100 if not provided.

#### [NEW] backend/src/products/products.module.ts

#### [NEW] backend/src/products/products.service.ts

Implement `findAll()` with Prisma `where` (search ILIKE, category exact match) and pagination using `skip`/`take`. Implement `findById()` returning a single product or `NotFoundException`.

#### [NEW] backend/src/products/products.controller.ts

Expose `GET /api/products` and `GET /api/products/:id` with public access. Output should be unified into `{ data, meta }` responses.

---

### Frontend Implementation

#### [MODIFY] frontend/app/page.tsx

Replace Next.js boilerplate with the Catalog layout. It will read search parameters (`search`, `category`, `page`) from standard Next.js `searchParams` prop to maintain synchronous URL state.

#### [NEW] frontend/app/components/product-card.tsx

Reusable card component displaying product name, image (with Next Image if applicable), price formatting, and category.

#### [NEW] frontend/app/components/search-filters.tsx

Search input (using debounce) and category filter buttons. Updating these will route exactly using standard `next/navigation` push to update the query string.

#### [NEW] frontend/app/products/[id]/page.tsx

Product Details page displaying the full product information, including image, description, price, stock, and a placeholder "Add to Cart" button.

#### [NEW] frontend/lib/api/products.ts

Axios bindings connecting to backend `/api/products` to fetch paginated lists and individual product details.

### TanStack Query Refactoring

All data fetching will be migrated from manual `useEffect` to TanStack Query.

- **`useQuery`**: Used in `CatalogPage` and `ProductDetailsPage` for data fetching.
- **`useSearchParams` Integration**: Query keys will include filters/pagination to ensure automatic re-fetching when URL state changes.
- **Error/Loading Handling**: Leveraged built-in React Query states to simplify component logic and improve UX (e.g., consistent skeleton display).

## Verification Plan

### Automated Tests

1. **Backend Unit (`pnpm --filter backend test`)**:
   - `products.service.spec.ts` (ProductService):
     - `TC-08.2.1`: Sem filtros → retorna `{ data, meta }` com paginação correta
     - `TC-08.2.2`: `search=notebook` → retorna apenas produtos com 'notebook' no nome (case-insensitive)
     - `TC-08.2.3`: `category=eletronicos` → filtra por categoria
     - `TC-08.2.4`: `page=2&limit=5` → retorna a segunda página com no máximo 5 itens
     - `TC-08.2.5`: `meta.total` reflete o total real de registros (não apenas da página)
     - `TC-08.3.1`: ID válido → retorna produto completo
     - `TC-08.3.2`: ID inexistente → lança `NotFoundException`

2. **Backend E2E (`pnpm --filter backend test:e2e`)**:
   - `products.e2e-spec.ts` (ProductsController):
     - `TC-08.4.1`: `GET /api/products` → 200 com `{ data, meta }`
     - `TC-08.4.2`: `GET /api/products?search=x` → 200 com resultados filtrados
     - `TC-08.4.3`: `GET /api/products/:id` válido → 200 com produto
     - `TC-08.4.4`: `GET /api/products/:id` inválido → 404

3. **Frontend E2E (`cd frontend && npx playwright test`)**:
   - `catalog.spec.ts` (Catalog Page):
     - `TC-08.5.1`: URL `?search=x` → campo de busca pré-preenchido e lista filtrada
     - `TC-08.5.2`: Skeleton exibido durante fetch
     - `TC-08.5.3`: Empty state com busca sem resultados
     - `TC-08.6.1`: Clicar em um produto na listagem redireciona para a página de detalhes do produto (`/products/:id`).
   - `product-details.spec.ts` (Product Details Page):
     - `TC-08.7.1`: Acessar a página de detalhes de um produto existente exibe suas informações corretas (nome, preço, descrição, etc.).
     - `TC-08.7.2`: Acessar a página de detalhes de um produto inexistente exibe mensagem de "Produto não encontrado".

### Manual Verification

1. Run local integration `pnpm dev`.
2. Inspect visually the responsiveness of grid on `localhost:3000`.
3. Interactively test the search text "notebook" and "eletronicos" filter.
4. Verify backend sub-300ms p95 capability in local logs.
