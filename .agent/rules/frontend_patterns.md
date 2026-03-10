# Frontend Development Patterns

Follow these patterns to ensure consistency across the frontend application.

## Gerenciamento de Estado e Requisições

- **TanStack Query (obrigatório)**: Toda e qualquer requisição assíncrona que envolva estado (loading, error, data) **DEVE** utilizar o TanStack Query (`useQuery`, `useMutation`).
  - **Proibido**: Uso de `useEffect` manual para carregar dados ou estados locais de `loading`/`error` para requisições.
  - **Motivo**: Centralização de cache, tratamento automático de estados de carregamento e consistência em toda a aplicação.
  - **Contexto Global**: Até mesmo o `AuthContext` deve utilizar `useQuery` para validar a sessão no mount da aplicação.

## Form Management

- **TanStack Query**: Use `useMutation` for all form submissions and API mutations. This provides built-in state management for loading, success, and error states.
- **React Hook Form**: Use `react-hook-form` with `zodResolver` for form state and validation.
- **Error Feedback**:
  - **Inline Validation**: Use `FormMessage` for field-specific validation errors.
  - **General Errors**: Use the `Alert` component from `@/components/ui/alert.tsx` to display general API errors or authentication failures at the top of the form.

## Authentication Strategy

- **Hybrid Auth**:
  - The application uses a hybrid approach where the JWT is received from the Backend and then stored in an **httpOnly cookie** via a local Next.js Route Handler (`/api/auth/session`).
  - **Session Route Handler**: This intermediate route exists to bridge client-side logic with server-side cookie management. This is necessary in Next.js to ensure the JWT is accessible by Middleware and Server Components for protected routes and SSR, while keeping it secure from XSS.
  - **AuthContext**: Use `AuthContext` to manage the global user state and coordinate login/logout flows.

## Component Standards

- **Consistency**: Maintain a consistent look and feel using `shadcn/ui` components.
- **Localization**: All user-facing text and error messages MUST be in **Portuguese**.
