import { test, expect } from '@playwright/test';


test.describe('RBAC and Route Protection - US-07', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('TC-07.1: Unauthenticated user should be redirected from /orders to /login', async ({ page }) => {
    // Mock unauthorized session
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: false })
      });
    });

    await page.goto('/orders');
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC-07.2: Unauthenticated user should be redirected from /admin to /login', async ({ page }) => {
    // Mock unauthorized session
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: false })
      });
    });

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC-07.3: Authenticated CUSTOMER should be redirected from /admin to /', async ({ page }) => {
    // Mock customer session
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          authenticated: true,
          user: { id: '2', email: 'customer@example.com', role: 'CUSTOMER' } 
        })
      });
    });

    // Set cookie for Middleware-level redirection
    await page.context().addCookies([{
      name: 'auth_token',
      value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwiZW1haWwiOiJjdXN0b21lckBleGFtcGxlLmNvbSIsInJvbGUiOiJDVVNUT01FUiJ9.signature",
      url: 'http://127.0.0.1:3000'
    }]);

    await page.goto('/admin');
    await expect(page).toHaveURL('/');
  });

  test('TC-07.4: Authenticated ADMIN should be allowed to access /admin', async ({ page }) => {
    // Mock admin session
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          authenticated: true,
          user: { id: '1', email: 'admin@marketplace.com', role: 'ADMIN' } 
        })
      });
    });
    // Set cookie for Middleware-level redirection
    await page.context().addCookies([{
      name: 'auth_token',
      value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBtYXJrZXRwbGFjZS5jb20iLCJyb2xlIjoiQURNSU4ifQ.signature",
      url: 'http://127.0.0.1:3000'
    }]);

    await page.goto('/admin');
    await expect(page).toHaveURL('/admin');
    await expect(page.getByTestId('admin-title')).toContainText('Painel Administrativo');
  });

  test('TC-07.5: Authenticated user (any role) should be allowed to access /profile', async ({ page }) => {
    // Mock customer session
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          authenticated: true,
          user: { id: '2', email: 'customer@example.com', role: 'CUSTOMER' } 
        })
      });
    });
    // Set cookie for Middleware-level redirection
    await page.context().addCookies([{
      name: 'auth_token',
      value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwiZW1haWwiOiJjdXN0b21lckBleGFtcGxlLmNvbSIsInJvbGUiOiJDVVNUT01FUiJ9.signature",
      url: 'http://127.0.0.1:3000'
    }]);

    await Promise.all([
      page.waitForResponse('**/api/auth/session', { timeout: 10000 }),
      page.goto('/profile')
    ]);
    await expect(page).toHaveURL('/profile', { timeout: 10000 });
    
    // Auth context might be loading
    const loadingMessage = page.getByText('Carregando...');
    if (await loadingMessage.isVisible()) {
      console.log('Page is loading, waiting...');
      await expect(loadingMessage).toBeHidden({ timeout: 10000 });
    }

    const title = page.getByTestId('profile-title');
    await expect(title).toBeVisible({ timeout: 10000 });
    await expect(title).toContainText('Perfil do Usuário');
  });
});
