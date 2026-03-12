# Implementation Plan - Cart, Checkout, and Order History (US-11 & US-12)

This plan outlines the implementation of a cart system, checkout process, and order history for the mini-marketplace.

## Design Decisions

### Cart State: React Context (not Zustand)

React Context with `useReducer` is the right choice for this cart because:
- The state is a single, well-scoped domain (items list + quantities)
- The project already uses Context for auth — consistent pattern
- No need for granular selectors, middleware, or devtools that Zustand provides
- Zustand would be over-engineering for a single isolated state slice

Zustand would be worth adding if multiple independent global state slices accumulate (UI flags, filters, cart, etc.) and "provider hell" becomes a concern.

---

## Proposed Changes

### 1. Database Schema

#### [MODIFY] [schema.prisma](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/backend/prisma/schema.prisma)

- Add `Order` model: `id`, `userId`, `total`, `status` (PENDING, COMPLETED, CANCELLED), `createdAt`.
- Add `OrderItem` model: `id`, `orderId`, `productId`, `productName` (snapshot), `quantity`, `unitPrice` (snapshot).
- Define relationships between `User`, `Order`, and `OrderItem`.
- **Note**: `Product` already has a `stock: Int` field — no migration needed for stock tracking.

---

### 2. Backend - Orders Module

#### [NEW] `backend/src/orders/`

- **[NEW] [orders.service.ts](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/backend/src/orders/orders.service.ts)**:
  - `create(userId: string, items: { productId: string, quantity: number }[])`:
    - Fetch all products involved in a **single transaction**.
    - **Validate stock for every item**: if `product.stock < requestedQuantity`, throw `BadRequestException` with a structured error body:
      ```json
      {
        "statusCode": 400,
        "error": "INSUFFICIENT_STOCK",
        "details": [
          { "productId": "...", "productName": "...", "requested": 3, "available": 1 }
        ]
      }
      ```
    - Decrement `product.stock` for each item atomically within the same transaction (using Prisma `$transaction`).
    - Calculate total from current prices (not cart prices — always use DB prices as source of truth).
    - Create `Order` and `OrderItem` records capturing `productName` and `unitPrice` snapshots.
  - `findByUser(userId: string)`: Return user's orders sorted by `createdAt` DESC, including items.

- **[NEW] [orders.controller.ts](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/backend/src/orders/orders.controller.ts)**:
  - `POST /api/orders`: Create order (Auth protected).
  - `GET /api/orders`: List user orders (Auth protected).

- **[NEW] [orders.module.ts](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/backend/src/orders/orders.module.ts)**: Register service and controller.

#### [MODIFY] [app.module.ts](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/backend/src/app.module.ts)

- Import and register `OrdersModule`.

---

### 3. Frontend - Cart and Orders

#### [NEW] [cart-context.tsx](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/lib/cart-context.tsx)

- Implement `CartProvider` using React Context + `useReducer`.
- State: `items` (array of `{ productId, name, price, quantity, stock }`) — persisted in `sessionStorage`.
  - **`stock` is stored on add** to enable local validation, but it is always the value at the time of the last fetch and may be stale.
- Actions:
  - `addItem(product)`: Add item or increment quantity. If `quantity + 1 > stock`, silently cap at `stock` and show a toast warning.
  - `updateQuantity(productId, quantity)`: Clamp to `[1, stock]`. If the requested quantity exceeds `stock`, show a toast: _"Apenas X unidade(s) disponível(is) para [nome]"_.
  - `removeItem(productId)`: Remove from cart.
  - `clearCart()`: Reset state and `sessionStorage`.
- Derived state: `totalAmount`, `totalItems`.

#### [NEW] [useProductStock.ts](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/lib/hooks/useProductStock.ts)

- A TanStack Query hook that fetches current stock for a list of `productId`s.
- Called by `CartDrawer` when the drawer opens to refresh stock values before checkout.
- Returned data is used to detect **stale cart items** (items whose cart quantity now exceeds current stock).

#### [MODIFY] [api.ts](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/lib/api.ts)

- Add order-related API calls using `bffApi`:
  - `createOrder(items)` — POST `/api/orders`
  - `getOrders()` — GET `/api/orders`

#### [NEW] [CartDrawer.tsx](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/components/cart/CartDrawer.tsx)

- Sidebar UI using shadcn/ui `Sheet`.
- On drawer open, call `useProductStock` to fetch fresh stock for all cart items.
- For each item where `cartQuantity > currentStock`:
  - Highlight the item with a warning badge.
  - Show inline message: _"Estoque insuficiente. Disponível: X"_.
  - Auto-adjust quantity down to `currentStock` (or remove if `currentStock === 0`), with a dismissible toast:
    _"A quantidade de [produto] foi ajustada para X por falta de estoque."_
    _"[Produto] foi removido do carrinho pois está sem estoque."_
- "Finalizar Pedido" button:
  - Disabled if cart is empty **or** any item still has a stock conflict after auto-adjustment.
  - On click: calls `createOrder`, then `clearCart` on success, redirects to `/orders`.
  - On `INSUFFICIENT_STOCK` error from backend (race condition): parse the `details` array and show one toast per affected product: _"Estoque de [nome] mudou para X unidade(s). Carrinho atualizado."_ — then update cart quantities to match the available stock and **do not navigate**.

#### [NEW] [order-history.tsx](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/app/orders/page.tsx)

- Protected page (via middleware).
- List of orders with collapsible details (Accordion).
- Empty state with link to products.
- Skeleton loader for fetching.

---

## Validation Summary

| Where | When | What is validated | User feedback |
|---|---|---|---|
| Cart (context) | `addItem` / `updateQuantity` | Quantity vs. stored stock (at add time) | Toast warning, quantity clamped |
| CartDrawer (open) | User opens drawer | Fresh stock fetched from API, stale quantities detected | Inline warning + auto-adjust + toast |
| CartDrawer (checkout) | `INSUFFICIENT_STOCK` from backend | Race condition after drawer was opened | Per-product toast, quantities updated, stay on cart |
| Backend (transaction) | `POST /api/orders` | Real-time stock in DB | Structured `400 INSUFFICIENT_STOCK` with details |

---

## Verification Plan

### Automated Tests

#### Backend - Unit Tests

- Create `orders.service.spec.ts` with scenarios:
  - `TC-11.2.1`: Create order with valid items -> calculates total correctly and decrements stock.
  - `TC-11.2.2`: Create order captures price and name snapshots.
  - `TC-11.2.3`: Invalid `productId` throws `BadRequestException`.
  - `TC-11.2.4`: Requested quantity exceeds stock -> throws `BadRequestException` with `INSUFFICIENT_STOCK` and correct `details` payload.
  - `TC-11.2.5`: Partial stock conflict (one item ok, one not) -> entire order rejected atomically, no stock decremented.
- Create `orders.controller.spec.ts` for HTTP scenarios:
  - `TC-11.3.1`: Valid token + items in stock -> 201.
  - `TC-11.3.2`: Missing token -> 401.
  - `TC-11.3.3`: Insufficient stock -> 400 with `INSUFFICIENT_STOCK` body.

#### Frontend - E2E Tests (Playwright)

- Create `e2e/orders.spec.ts`:
  1. Authenticate user.
  2. Add products to cart.
  3. Open cart drawer and verify total.
  4. Click "Finalizar Pedido".
  5. Verify redirect to `/orders` and success toast.
  6. Verify new order appears in history with correct details.
  7. **(Stock conflict scenario)**: Simulate stock drop between add and checkout; verify stale item warning appears in drawer and quantity is auto-adjusted.

### Manual Verification

1. Login with a test user.
2. Add multiple products to the cart.
3. Refresh page (verify persistence in `sessionStorage`).
4. Complete purchase — verify stock is decremented in DB.
5. Navigate to `/orders` and verify the list.
6. Try to access `/orders` without being logged in (verify redirect to `/login`).
7. **(Stock conflict)**: Add product X (stock=2) to cart with quantity=2. Manually set `stock=1` in DB. Open cart drawer — verify warning appears and quantity auto-adjusts to 1.
8. **(Race condition)**: Add product with quantity=1. Manually set `stock=0` just before clicking "Finalizar Pedido". Verify error toast appears and user stays on cart.
