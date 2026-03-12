import { test, expect } from '@playwright/test';

test.describe('Register Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Increase timeout for cold starts
    page.setDefaultTimeout(60000);

    // Clear cookies for a clean state
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

    // Listen for console logs, requests and responses in the browser for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
    });
    page.on('request', request => {
      if (request.url().includes('/api/')) console.log(`>> REQUEST: ${request.method()} ${request.url()}`);
    });
    page.on('response', response => {
      if (response.url().includes('/api/')) console.log(`<< RESPONSE: ${response.status()} ${response.url()}`);
    });

    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Cadastro', { exact: true })).toBeVisible();
  });

  test('TC-05: Successful Registration - Should display success toast and redirect to home', async ({ page }) => {
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com', role: 'CUSTOMER' };

    await page.route('**/api/auth/register', async route => {
      await route.fulfill({ 
        status: 201, 
        contentType: 'application/json',
        body: JSON.stringify({ 
          access_token: 'mock-token', 
          user: mockUser 
        }) 
      });
    });

    // Mock the session check for after registration
    await page.route('**/api/auth/session', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ 
          status: 200, 
          contentType: 'application/json',
          body: JSON.stringify({ authenticated: true, user: mockUser }) 
        });
      } else {
        await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
      }
    });

    await page.getByTestId('name-input').fill('Test User');
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('password-input').fill('securepassword123');

    // Submit and wait for response
    await Promise.all([
      page.waitForResponse('**/api/auth/register'),
      page.getByTestId('register-submit').click()
    ]);

    // Sonner toast check
    await expect(page.locator('body')).toContainText('Cadastro realizado com sucesso!', { timeout: 15000 });
    
    await expect(page).toHaveURL('/', { timeout: 15000 });
  });

  test('TC-06: Error Treatment - Should display error for already registered email (409)', async ({ page }) => {
    await page.route('**/api/auth/register', async route => {
      await route.fulfill({ 
        status: 409, 
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Email already registered' }) 
      });
    });

    await page.getByTestId('name-input').type('Duplicate User', { delay: 30 });
    await page.keyboard.press('Tab');
    await page.getByTestId('email-input').type('duplicate@example.com', { delay: 30 });
    await page.keyboard.press('Tab');
    await page.getByTestId('password-input').type('password123', { delay: 30 });
    await page.keyboard.press('Tab');

    // Click and wait for the mock response
    await Promise.all([
      page.waitForResponse('**/api/auth/register'),
      page.getByTestId('register-submit').click()
    ]);

    // Check for the error message using standardized testid
    const errorAlert = page.getByTestId('auth-error');
    await expect(errorAlert).toBeVisible({ timeout: 15000 });
    await expect(errorAlert).toContainText('já está cadastrado');
  });

  test('TC-07: Client-side Validation - Should display Zod validation errors', async ({ page }) => {
    // Direct click to trigger validation
    await page.getByTestId('register-submit').click();

    await expect(page.locator('body')).toContainText('O nome deve ter pelo menos 2 caracteres', { timeout: 10000 });
    await expect(page.locator('body')).toContainText('Email inválido', { timeout: 10000 });
    await expect(page.locator('body')).toContainText('A senha deve ter pelo menos 8 caracteres', { timeout: 10000 });
  });
});
