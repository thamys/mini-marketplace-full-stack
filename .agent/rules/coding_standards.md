# Coding Standards

Follow these rules to maintain code quality and consistency across the project.

## Language Standards

- **Backend (Internal)**: All internal logic, variable names, documentation, and error messages in `throw` statements MUST be in **English**.
- **Frontend (User-Facing)**: All text, labels, and messages explicitly displayed to the end user MUST be in **Portuguese**.

## Type Safety

- **No `any`**: Strictly avoid the use of `any`. Use proper interfaces, types, or `unknown` with type guards.
- **No Lint Ignoring**: Do not use `eslint-disable` comments to hide type errors. Fix the underlying type issue instead.
- **Unit Testing**:
  - For Jest mocks, ensure proper typing of mocked services/repositories.
  - When referencing mocked methods in expectations, use the `jest.Mocked` type or type casting to `jest.Mock` to avoid `unbound-method` errors without disabling lint.

## Validation

- Use **Zod** for schema validation in both frontend and backend.
- Maintain consistent DTO names (e.g., `LoginDto`, `RegisterDto`).
