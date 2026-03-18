import { test, expect } from '@playwright/test';
import { setupCustomerSession, setupAdminSession } from './helpers/auth';
import { MOCK_PAGINATED_PRODUCTS } from './fixtures';

test.describe('Authentication Flow - Standardized', () => {
  test.beforeEach(async ({ page }) => {
    // Increase timeout for cold starts
    page.setDefaultTimeout(60000);
    
    // Clear cookies before each test
    await page.context().clearCookies();

    // Global mock for products often requested in the background (Header/Footer)
    await page.route('**/api/products*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], meta: { total: 0, page: 1, limit: 12, totalPages: 0 } })
      });
    });

    // Mock session by default as unauthenticated
    await page.route('**/api/auth/session', async route => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ authenticated: false })
        });
      } else if (method === 'POST' || method === 'DELETE') {
        await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
      } else {
        await route.continue();
      }
    });

    await page.goto('/login', { waitUntil: 'domcontentloaded' });
  });

  test('TC-01: Successful login - Should display success toast and redirect to home', async ({ page }) => {
    const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBtYXJrZXRwbGFjZS5jb20iLCJyZWFsX25hbWUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiIsInJvbGUiOiJBRE1JTiJ9.signature";
    const mockUser = { id: '1', email: 'admin@marketplace.com', name: 'Admin', role: 'ADMIN' };
    
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access_token: mockToken, user: mockUser })
      });
    });

    // Mock the session check for the redirection logic after login
    // Overriding the default mock for this specific test
    await page.route('**/api/auth/session', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ 
          status: 200, 
          body: JSON.stringify({ authenticated: true, user: mockUser }) 
        });
      } else {
        await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
      }
    });

    await page.getByTestId('email-input').fill('admin@marketplace.com');
    await page.getByTestId('password-input').fill('Admin@123');
    await page.getByTestId('login-submit').click();

    // Verify success toast first
    await expect(page.locator('body')).toContainText('Login realizado com sucesso!', { timeout: 5000 });

    // Then verify redirection to admin - wait for URL change
    await page.waitForURL('/admin', { timeout: 10000 });
    await expect(page).toHaveURL('/admin');
  });

  test('TC-02: Invalid credentials - Should display error alert', async ({ page }) => {
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          message: "Invalid credentials",
          error: "Unauthorized",
          statusCode: 401
        })
      });
    });

    await page.getByTestId('email-input').click();
    await page.getByTestId('email-input').pressSequentially('error@example.com', { delay: 50 });
    await page.keyboard.press('Tab');
    
    await page.getByTestId('password-input').pressSequentially('password123', { delay: 50 });
    await page.keyboard.press('Tab');
    
    await page.getByTestId('login-submit').click();
    await page.waitForResponse(resp => resp.url().includes('/auth/login') && resp.request().method() === 'POST', { timeout: 5000 });

    await expect(page.getByTestId('auth-error')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('auth-error')).toContainText('E-mail ou senha incorretos.');
  });

  test('TC-03: Route Protection - Authenticated user should be redirected from login/register to home', async ({ page }) => {
    const dummyJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6IkNVU1RPTUVSIn0.signature";
    const dummyUser = { id: '1', email: 'test@example.com', name: 'Test User', role: 'CUSTOMER' };
    
    // Mock session as authenticated
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({ 
        status: 200, 
        body: JSON.stringify({ authenticated: true, user: dummyUser }) 
      });
    });

    // Set cookie for Middleware-level redirection
    await page.context().addCookies([{
      name: 'auth_token',
      value: dummyJwt,
      url: 'http://localhost:3000'
    }]);

    await page.goto('/login', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL('/', { timeout: 5000 });

    await page.goto('/register', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL('/', { timeout: 5000 });
  });

  test('TC-04: Navigation - Should navigate between login and register pages', async ({ page }) => {
    // Check for "Cadastrar-se" instead of "Cadastre-se" to match current UI
    await page.click('text=Cadastrar-se');
    await expect(page).toHaveURL('/register');

    // Wait for the register page to load and find the link back to login
    await page.click('text=Entre aqui');
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Logout Flow', () => {
  test('TC-05: Logout de customer — limpa sessão e redireciona para /login', async ({ page }) => {
    await setupCustomerSession(page);

    // Mock DELETE /api/auth/session (chamado pelo logout)
    let logoutCalled = false;
    await page.route('**/api/auth/session', async (route) => {
      if (route.request().method() === 'DELETE') {
        logoutCalled = true;
        await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
      } else {
        await route.continue();
      }
    });

    // Mock /api/products para o catálogo carregar sem erros
    await page.route('**/api/products*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PAGINATED_PRODUCTS),
      });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Customer vê header com dropdown de usuário.
    // getInitials('user@marketplace.com') → 'U'
    // O DropdownMenuTrigger renderiza as iniciais como conteúdo de texto — aguardar hydration
    const avatarTrigger = page.locator('header').getByText('U', { exact: true });
    await expect(avatarTrigger).toBeVisible({ timeout: 15000 });
    await avatarTrigger.click();
    await page.getByRole('menuitem', { name: 'Sair' }).click();

    // Confirmar que DELETE /api/auth/session foi disparado
    await page.waitForURL('/login', { timeout: 8000 });
    expect(logoutCalled).toBe(true);
    await expect(page).toHaveURL('/login');
  });

  test('TC-06: Logout de admin — limpa sessão e redireciona para /login', async ({ page }) => {
    await setupAdminSession(page);

    // Mock DELETE /api/auth/session
    let logoutCalled = false;
    await page.route('**/api/auth/session', async (route) => {
      if (route.request().method() === 'DELETE') {
        logoutCalled = true;
        await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
      } else {
        await route.continue();
      }
    });

    // Mock GET /api/proxy/orders (admin orders page)
    await page.route('**/api/proxy/orders*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/admin', { waitUntil: 'domcontentloaded' });

    // Admin usa header simplificado com botão "Sair" diretamente visível
    await page.getByRole('button', { name: 'Sair' }).click();

    // Confirmar redirecionamento para /login
    await page.waitForURL('/login', { timeout: 8000 });
    expect(logoutCalled).toBe(true);
    await expect(page).toHaveURL('/login');
  });
});
