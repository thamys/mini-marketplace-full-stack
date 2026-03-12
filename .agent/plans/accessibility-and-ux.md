# Plan: Global Accessibility, Responsiveness, and Enhanced UX (Comprehensive)

This plan addresses issues #44-#47 and incorporates specific feedback on grid pixel constraints, detailed verification, and global accessibility (including Header/Footer).

## Proposed Changes

### 1. Global Setup & Structural Accessibility

#### [MODIFY] [layout.tsx](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/app/layout.tsx)

- Change `<html lang="en">` to `<html lang="pt-BR">` to match requirements.
- Add a "Pular para o conteúdo" (Skip to content) link as the first item in the body for keyboard users.
- Ensure the `<main>` tag has an `id="main-content"`.

#### [MODIFY] [Header.tsx](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/components/Header.tsx)

- Add `aria-label="Menu Principal"` to the `<nav>` element.
- Ensure the logo/Marketplace link has an appropriate label.

#### [MODIFY] [Footer.tsx](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/components/Footer.tsx)

- Add `aria-label="Rodapé"` or equivalent to navigation sections within the footer.
- Ensure social links have descriptive `aria-label`.

### 2. Catalog Layout & Responsiveness (#45)

#### [MODIFY] [page.tsx](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/app/page.tsx)

- **Grid Definition**: Use `grid-cols-[repeat(auto-fill,minmax(280px,350px))]`. No `fr` units.
- Refactor to use `useSuspenseQuery` for a smoother loading experience with skeletons.

### 3. UI States & Admin UX

#### [MODIFY] [Admin Components]

- Replace all native `confirm()` calls with Shadcn `AlertDialog`.
- Implement `ProductModal` with a confirmation step when closing with unsaved changes.
- Ensure all form fields use `aria-describedby` for error messages (handled by Shadcn/Radix).

---

## Verification Plan

### Automated Tests: Playwright (Accessibility Focus)

- **Skip Link**: Verify that the "Pular para o conteúdo" link is functional and moves focus to `#main-content`.
- **Keyboard Navigation**: Verify focus order: Header -> Main Content -> Footer.
- **Roles & Landmarks**: Assert one `<main>`, one `<header>`, one `<footer>`, and clearly labeled `<nav>` elements.
- **Admin Flow**: Verify `AlertDialog` appearance during deletion.

### Automated Tests: Jest (Functional)

- **Suspense/Skeleton**: Verify `CatalogSkeleton` renders while query is fetching.
- **Empty State**: Verify message when products count is zero.
- **Error State**: Verify retry logic button presence and functionality.

### Manual Verification

1. **Screen Reader**: Test with VoiceOver/NVDA to ensure navigation is logical and all elements are described.
2. **Lighthouse**: Final audit. Goal: **Acessibilidade ≥ 95**.
