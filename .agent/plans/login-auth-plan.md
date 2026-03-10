# Implementation Plan - Login and Authentication

Implement a secure login system using JWT for the mini-marketplace, including backend authentication logic and a frontend login interface with session management via httpOnly cookies.

## Proposed Changes

### Backend (NestJS)

#### [MODIFY] [package.json](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/backend/package.json)

- Add dependencies: `@nestjs/jwt`.

#### [NEW] [login.dto.ts](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/backend/src/auth/dto/login.dto.ts)

- Define `LoginSchema` and `LoginDto` using Zod.

#### [MODIFY] [auth.service.ts](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/backend/src/auth/auth.service.ts)

- Implement `login(credentials: LoginDto)` method.
- Verify user existence and password hash using `bcrypt`.
- Generate JWT using `JwtService` with payload `{ sub: userId, role, email }`.
- Throw `UnauthorizedException` with generic message for invalid credentials.

#### [MODIFY] [auth.controller.ts](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/backend/src/auth/auth.controller.ts)

- Add `POST /auth/login` endpoint.
- Use `ZodValidationPipe` for request validation.

#### [MODIFY] [auth.module.ts](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/backend/src/auth/auth.module.ts)

- Register `JwtModule` with secret and expiration (24h).

---

### Frontend (Next.js)

#### [MODIFY] [package.json](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/package.json)

- Add dependencies: `jwt-decode`.

#### [NEW] [auth-context.tsx](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/lib/auth-context.tsx)

- Create `AuthContext` to manage user state.
- Implement `login`, `logout`, and session restoration.
- Use `jwt-decode` to extract user info from the token on the client-side.

#### [NEW] [route.ts](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/app/api/auth/session/route.ts)

- Handle `POST /api/auth/session` to set the `httpOnly` cookie.
- Handle `DELETE /api/auth/session` to clear the cookie.

#### [NEW] [login/page.tsx](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/app/login/page.tsx)

- Create the login page with a form.
- Integrate with `AuthContext.login`.
- Display generic error message on 401.

#### [MODIFY] [Providers.tsx](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/components/Providers.tsx)

- Wrap application with `AuthProvider`.

## Verification Plan

### Automated Tests

#### Backend Unit Tests

- `pnpm --filter backend test`: Run `auth.service.spec.ts` to verify login logic.
- **TC-06.1.1**: Valid credentials return token and expiresIn.
- **TC-06.1.2**: Incorrect password throws `UnauthorizedException`.
- **TC-06.1.3**: Non-existent email throws `UnauthorizedException`.

#### Backend E2E Tests

- `pnpm --filter backend test:e2e`: Verify `POST /api/auth/login` returns 200/401 correctly.

#### Frontend E2E Tests

- `pnpm --filter frontend test:e2e`: Create `frontend/e2e/login.spec.ts` to verify:
  - **TC-06.3.2**: Token is set in `httpOnly` cookie and NOT in `localStorage`.
  - **TC-06.4.1**: Generic error message on 401.
  - Successful redirect after login.

### Manual Verification

1. Register a new user via the interface (if available) or via Postman/Seed.
2. Attempt login with correct credentials.
3. Verify redirection and user state in the UI.
4. Attempt login with incorrect password and verify the generic error message.
5. Check browser dev tools to ensure the cookie is `httpOnly` and `localStorage` is clean.
