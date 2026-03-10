import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:4000/api';

test.describe('Authentication Flow - Standardized', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies before each test
    await page.context().clearCookies();
    await page.goto('/login');
  });

  test('TC-01: Successful login - Should display success toast and redirect to home', async ({ page }) => {
    const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBtYXJrZXRwbGFjZS5jb20iLCJyZWFsX25hbWUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiIsInJvbGUiOiJBRE1JTiJ9.signature";
    const mockUser = { id: '1', email: 'admin@marketplace.com', name: 'Admin', role: 'ADMIN' };
    
    await page.route(`${BASE_URL}/auth/login`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access_token: mockToken, user: mockUser })
      });
    });

    // Mock the session check for the redirection logic after login
    await page.route('**/api/auth/session', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
      } else {
        await route.fulfill({ 
          status: 200, 
          body: JSON.stringify({ authenticated: true, user: mockUser }) 
        });
      }
    });

    await page.fill('input[id="email"]', 'admin@marketplace.com');
    await page.fill('input[id="password"]', 'Admin@123');
    await page.click('button[type="submit"]');

    // Verify success toast first
    await expect(page.locator('body')).toContainText('Login realizado com sucesso!', { timeout: 10000 });

    // Then verify redirection to home
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('TC-02: Invalid credentials - Should display error alert', async ({ page }) => {
    await page.route(`${BASE_URL}/auth/login`, async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' })
      });
    });

    await page.fill('input[id="email"]', 'wrong@example.com');
    await page.fill('input[id="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    const errorAlert = page.locator('[data-testid="login-error"]');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Invalid credentials');
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

    await page.goto('/login');
    await expect(page).toHaveURL('/', { timeout: 10000 });

    await page.goto('/register');
    await expect(page).toHaveURL('/', { timeout: 10000 });
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
