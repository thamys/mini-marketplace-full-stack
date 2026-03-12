# Admin Layout Refactor and Dashboard Implementation

Refactor the admin experience to feel more like a dedicated dashboard. This includes changing the landing page for admins, adding a sidebar navigation, and simplifying the header and footer.

## Proposed Changes

### [Component Name] Middleware and Routing

#### [MODIFY] [middleware.ts](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/middleware.ts)

- Add a redirect for users with the `ADMIN` role from the root path `/` to `/admin`.

---

### [Component Name] Layout and Navigation

#### [NEW] [Sidebar.tsx](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/components/admin/Sidebar.tsx)

- Create a new sidebar component for admin pages.
- Links: Dashboard (`/admin`), Gerenciar Produtos (`/admin/products`), Gerenciar Pedidos (`/admin/orders`), Voltar para a Loja (`/`).

#### [NEW] [layout.tsx](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/app/admin/layout.tsx)

- Create a dedicated layout for the `/admin` route group.
- This layout will include the `Sidebar` on the left and the main content on the right.

#### [MODIFY] [Header.tsx](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/components/Header.tsx)

- Add logic to show a simplified version (only the logo/name) when the user is an admin or the path starts with `/admin`.

#### [MODIFY] [Footer.tsx](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/components/Footer.tsx)

- Add logic to show a simplified version (copyright only) when the user is an admin or the path starts with `/admin`.

---

### [Component Name] Admin Dashboard

#### [MODIFY] [page.tsx](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/app/admin/page.tsx)

- Replace the simple "Painel Administrativo" text with a real dashboard.
- Components needed: `StatsCard` (Products count, Orders count, Total Revenue if possible).
- Display a list of the 5 most recent orders.

---

## Verification Plan

### Automated Tests

- **Update RBAC tests**: Modify `frontend/e2e/rbac.spec.ts` to verify that an admin is redirected from `/` to `/admin`.
- **New Dashboard Tests**: Create `frontend/e2e/admin-dashboard.spec.ts` to:
  - Verify that the Sidebar is present on all admin routes.
  - Verify that the Header is simplified.
  - Verify that the Dashboard displays correct initial "relevant data" (mocked).
- **Run tests**:
  ```bash
  pnpm --filter frontend test:e2e
  ```

### Manual Verification

- Log in as an Admin and verify:
  - Landing on `/` redirects to `/admin`.
  - Sidebar is visible and functional.
  - Header and Footer are simplified.
- Log in as a Customer and verify:
  - Normal layout remains unchanged.
  - No access to `/admin`.
