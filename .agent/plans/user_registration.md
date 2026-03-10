# Implementation Plan - User Registration ([US-05])

This plan outlines the steps to implement user registration, allowing new users to create accounts with email, name, and password.

## User Review Required

> [!IMPORTANT]
>
> - **Architecture**: I've chosen the **Service Layer** approach (`Controller -> Service -> Repository`). While `Controller -> Repository` is faster for simple apps, the Service Layer keeps business logic (like hashing and existence checks) separate from HTTP handling, making it easier to test and scale.
> - **Libraries**:
>   - **Form Management**: `react-hook-form` + `zod` (standard for performance and validation).
>   - **Server State**: `@tanstack/react-query` (ideal for handling async requests, loading states, and caching).
>   - **Styling/UI**: Tailwind CSS v4 + **shadcn/ui** + `lucide-react` (icons) + `sonner` (toasts).
> - **Feedback Strategy**:
>   - **In-Form**: Inline error/success messages for validation and API failures.
>   - **Toast**: Only for success/error messages that persist across redirects (e.g., "Registration successful! Login now").

## Proposed Changes

### Backend

#### [MODIFY] [schema.prisma](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/backend/prisma/schema.prisma)

- Add `passwordHash` (String) and `role` (Role) fields to the `User` model.
- Add `Role` enum with `CUSTOMER` and `ADMIN` values.

#### [NEW] [auth module](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/backend/src/auth)

- **[NEW] `auth.service.ts`**: Contains registration logic (email check, hashing, user creation).
- **[NEW] `auth.controller.ts`**: Exposes `POST /api/auth/register` endpoint. Calls `AuthService`.
- **[NEW] `auth.module.ts`**: Unions auth components and injects `UserRepository`.
- **[NEW] `dto/register.dto.ts`**: Zod schema for registration request validation (includes `email`, `password`, and `name`).

#### [MODIFY] [app.module.ts](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/backend/src/app.module.ts)

- Import and register `AuthModule`.

#### [MODIFY] [seed.ts](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/backend/prisma/seed.ts)

- Update admin user creation to include a hashed password and `ADMIN` role.
- Keep the plain password as a comment in the file.

---

### Frontend

#### [NEW] [register/page.tsx](file:///Users/thamys/Codes/technical-tests/mini-marketplace-full-stack/frontend/app/register/page.tsx)

- Create a registration form with `name`, `email` and `password` fields using `react-hook-form`.
- Implement inline validation using `zod`.
- Show API error messages (like 409 Conflict) directly in the form footer or specific fields.
- Use `sonner` to toast "Cadastro realizado com sucesso!" before redirecting to login/home.

## Verification Plan

### Backend Test Scenarios (Jest / Supertest)

- ** AuthService Unit Tests**:
  - `register()` successful with valid data.
  - `register()` throws `ConflictException` for existing email.
  - `register()` calls `bcrypt.hash` with correct cost (10).
- **Controller E2E Tests**:
  - `POST /api/auth/register` returns 201 and user data (no `passwordHash`).
  - `POST /api/auth/register` returns 400 for invalid payload (Zod).
  - `POST /api/auth/register` returns 409 for duplicate email.

### Frontend Test Scenarios (Form Validation)

- **Inline Validation**:
  - Empty `name` → "O nome deve ter pelo menos 2 caracteres".
  - Invalid `email` format → "Email inválido".
  - Password < 8 characters → "A senha deve ter pelo menos 8 caracteres".
- **API Feedback**:
  - Server returns 409 → Show "Este email já está cadastrado" below the email field.
  - Server returns 500 → Show generic error message at form bottom.
- **Success Flow**:
  - Spinner/Loading state while request is in flight.
  - Show Toast "Cadastro realizado com sucesso!".
  - Redirect to Home.

### Manual Verification

1. Start backend and frontend services.
2. Navigate to `http://localhost:3000/register`.
3. Try scenarios above (validation, duplicate, success).
4. Verify database: `SELECT * FROM "User"` shows hashed password and not plain text.
