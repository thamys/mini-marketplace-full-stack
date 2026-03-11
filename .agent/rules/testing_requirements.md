# Testing Requirements

Follow these rules to ensure the reliability and stability of the application.

## E2E Testing Mandate

- **Backend**: ALL new endpoints in ANY controller MUST have corresponding E2E tests (typically in `test/*.e2e-spec.ts`).
  - Automated tests must cover successful scenarios and common error cases (e.g., 400 Bad Request, 401 Unauthorized, 404 Not Found).
- **Frontend**: ALL new user-facing features or pages MUST have corresponding Playwright E2E tests (typically in `frontend/e2e/*.spec.ts`).
  - Tests must verify core user flows, form submissions, and error states.

## Unit Testing

- **Business Logic**: Any complex business logic added to Services or Repositories MUST be covered by unit tests (Jest).
- **Mocking**: Ensure mocks are properly typed to avoid `any` and maintain type safety.

## Configuration and Fail-Fast

- **Critical Infrastructure**: When accessing critical configuration variables (e.g., database URLs, JWT secrets, external API keys), prefer using `configService.getOrThrow()` or similar "fail-fast" patterns.
- **Bootstrapping**: If a required environment variable is missing, the application should fail to start with a clear error message.
