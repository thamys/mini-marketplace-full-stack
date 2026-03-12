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

  test('TC-07.2: Unauthenticated user should be redirected from /admin/products to /login', async ({ page }) => {
    // Mock unauthorized session
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: false })
      });
    });

    await page.goto('/admin/products');
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC-07.3: Authenticated CUSTOMER should be redirected from /admin/products to /', async ({ page }) => {
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
      url: 'http://localhost:3000'
    }]);

    await page.goto('/admin/products');
    await expect(page).toHaveURL('/');
  });

  test('TC-07.4: Authenticated ADMIN should be allowed to access /admin/products', async ({ page }) => {
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
      url: 'http://localhost:3000'
    }]);

    await page.goto('/admin/products');
    await expect(page).toHaveURL('/admin/products');
    await expect(page.getByTestId('admin-title')).toContainText('Gerenciamento de Produtos');
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
      url: 'http://localhost:3000'
    }]);

    await Promise.all([
      page.waitForResponse('**/api/auth/session', { timeout: 5000 }),
      page.goto('/profile')
    ]);
    
    // Ensure we wait for the session update
    await page.waitForTimeout(500);
    
    await expect(page).toHaveURL('/profile', { timeout: 10000 });
    
    // Auth context might be loading
    const loadingMessage = page.getByText('Carregando...');
    await expect(loadingMessage).toBeHidden({ timeout: 5000 });

    const title = page.getByTestId('profile-title');
    await expect(title).toBeVisible({ timeout: 5000 });
    await expect(title).toContainText('Perfil do Usuário');
  });
});
