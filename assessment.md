# Full-Stack Challenge — “Mini Marketplace” 

**Goal:** Build a small, production-like Mini Marketplace: a Next.js + TypeScript frontend that talks to a Node + TypeScript backend, with Postgres persistence, authentication, tests, and a reproducible run/deploy story.

## Tech stack (recommended)
* **Frontend:** Next.js + React + TypeScript
* **Backend:** Node.js + TypeScript (Express or NestJS)
* **ORM / DB:** Prisma or TypeORM with PostgreSQL
* **Auth:** JWT (or session cookie)
* **Testing:** Jest + React Testing Library (unit), Playright (E2E)
* **Dev / Run:** Docker / docker-compose, or simple pnpm/npm scripts
* **CI:** GitHub Actions (optional but appreciated)

## Scope & tasks (minimum)
Implement the following minimum features. Keep the UI simple but usable and accessible.

### Backend
**Authentication**
* `POST /api/auth/register` — create user (email + password).
* `POST /api/auth/login` — returns JWT.

**Products**
* `GET /api/products` — list products with pagination, filtering (by category or name substring) and sorting (price or name).
* `GET /api/products/:id` — product details.
* `POST /api/products` — create product (protected; admin or authenticated).
* `PUT /api/products/:id`, `DELETE /api/products/:id` — update/delete (protected).

**Orders**
* `POST /api/orders` — create order for authenticated user (contains product ids + quantities).
* `GET /api/orders` — list user’s orders (authenticated).

**Data & infra**
* Postgres schema + migrations and seed data (products + at least one user).
* Input validation and proper HTTP error codes.

### Frontend
**Public pages**
* Product listing page with pagination, search/filter, and sort.
* Product details page.

**Auth & user flows**
* Register & Login pages (persist JWT securely).
* A logged-in user can create an order (simple cart flow) and view their orders page.

**Admin**
* Simple admin UI to create/update/delete products (can be gated via a flag on the user).

**Polish**
* Mobile-responsive layout, loading and error states, accessible markup (semantic HTML, proper labels).
* Minimal but clear UX for validations and success/error messages.

## Deliverables
Public or private Git repo with:
* `README.md` with run instructions, design decisions, and tradeoffs.
* Backend and frontend source code.
* `Dockerfile` / `docker-compose.yml` for running services together OR clear, 1–2 command local run instructions.
* Tests and test commands.
* Example `.env.example` and DB migration/seed scripts.
* *(Optional)* Deployed demo URL or short screencast/gif showing the main flows.

## Acceptance criteria (must-haves)
* All required API endpoints exist and pass basic integration tests.
* The frontend can:
  * Display paginated product lists and search/filter results.
  * Authenticate and perform authenticated actions (place an order, view orders).
  * Admin user can manage products.
* Database migrations/seeds work and the app starts reproducibly via Docker or documented scripts.
* README includes: how to run locally, how to run tests, authentication details, and a short “next steps / tradeoffs” note.
* At least unit tests for critical backend logic and one E2E test covering login → add to cart → place order flow.

## Evaluation rubric (suggested)
* Correctness & completeness — 30%
* Code quality & architecture — 20%
* Tests (unit & E2E) — 15%
* Developer experience (README, run scripts, migrations) — 15%
* UX / Accessibility / Responsiveness — 10%
* Design explanations & tradeoffs — 10%

## Stretch goals (nice to have)
* Implement optimistic UI updates for the cart.
* Add server-side pagination and caching headers.
* Include CI (GitHub Actions) that runs lint + tests.
* Add role-based authorization (e.g., admin vs customer).
* Add small performance considerations (DB indexes for searches).

## Minimal run instructions example (for README)
* Copy `.env.example` → `.env` and set DB creds.
* `docker-compose up --build` (starts frontend, backend, postgres).
* `pnpm install` then `pnpm dev` (if not using Docker).
* `pnpm test` (unit tests), `pnpm e2e` (Cypress E2E).

## Final notes
Keep the implementation focused and deliver something well-running rather than trying to implement every edge case.
Provide clear documentation and a short “what I would build next” paragraph.
