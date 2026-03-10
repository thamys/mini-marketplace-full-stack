# Implementation Plan - Login and Authentication

Implement a secure login system using JWT for the mini-marketplace, including backend authentication logic, frontend login interface, session management via httpOnly cookies, and route protection.

## Proposed Changes

### Backend (NestJS)

#### [MODIFY] [package.json](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/backend/package.json)

- Add dependencies: `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`.

#### [NEW] [login.dto.ts](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/backend/src/auth/dto/login.dto.ts)

- Define `LoginSchema` and `LoginDto` using Zod.

#### [MODIFY] [auth.service.ts](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/backend/src/auth/auth.service.ts)

- Implement `login(credentials: LoginDto)` method.
- Verify user existence and password hash using `bcrypt`.
- Generate JWT with payload `{ sub: userId, role, email }`.

#### [NEW] [jwt.strategy.ts](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/backend/src/auth/jwt.strategy.ts)

- Implement Passport JWT strategy to validate tokens and extract user payload.

#### [NEW] [jwt-auth.guard.ts](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/backend/src/auth/jwt-auth.guard.ts)

- Create a reusable `JwtAuthGuard`.

#### [MODIFY] [auth.controller.ts](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/backend/src/auth/auth.controller.ts)

- Add `POST /auth/login` endpoint.
- Add `GET /auth/me` endpoint protected by `JwtAuthGuard` for verification.

#### [MODIFY] [auth.module.ts](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/backend/src/auth/auth.module.ts)

- Register `JwtModule` and Passport strategies.

---

### Frontend (Next.js)

#### [MODIFY] [package.json](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/package.json)

- Add dependencies: `jwt-decode`.

#### [NEW] [auth-context.tsx](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/lib/auth-context.tsx)

- Create `AuthContext` to manage user state.
- Implement `login`, `logout`, and session restoration.
- **Redirection Logic:** Redirect authenticated users away from `/login` and `/register` to `/`.

#### [NEW] [route.ts](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/app/api/auth/session/route.ts)

- Handle session storage via `httpOnly` cookie.

#### [NEW] [login/page.tsx](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/app/login/page.tsx)

- Login form with generic error handling.
- **Link to Register:** Add a link to the registration page.

#### [MODIFY] [register/page.tsx](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/app/register/page.tsx)

- **Link to Login:** Add a link to the login page.

#### [NEW] [profile/page.tsx](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/app/profile/page.tsx)

- Simple authenticated page to verify route protection.

## Verification Plan

### Automated Tests

#### Backend Unit/Integration

- **TC-06.2.3**: `GET /auth/me` without token returns 401.
- **TC-06.2.4**: `GET /auth/me` with valid token returns user data.

#### Frontend E2E (Playwright)

- **TC-06.5.1**: Authenticated user trying to access `/login` is redirected to `/`.
- **TC-06.5.2**: Authenticated user trying to access `/register` is redirected to `/`.
- **TC-06.5.3**: Unauthenticated user trying to access `/profile` (if protected via middleware/context) is redirected to `/login`.
- **TC-06.6.1**: Verify links between login and register pages work correctly.

### Manual Verification

1. Log in and attempt to visit `/login` manually via URL; verify redirection to home.
2. Check navigation links between registration and login forms.
3. Access `/profile` and verify it displays user info when logged in.
