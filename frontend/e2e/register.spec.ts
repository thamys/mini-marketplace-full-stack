import { test, expect } from '@playwright/test';


test.describe('Register Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies for a clean state
    await page.context().clearCookies();
    await page.goto('/register');
    await expect(page.getByText('Cadastro', { exact: true })).toBeVisible();
  });

  test('TC-05: Successful Registration - Should display success toast and redirect to home', async ({ page }) => {
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com', role: 'CUSTOMER' };

    await page.route('**/auth/register', async route => {
      await route.fulfill({ 
        status: 201, 
        contentType: 'application/json',
        body: JSON.stringify({ 
          access_token: 'mock-token', 
          user: mockUser 
        }) 
      });
    });

    // Mock the session check for the redirection logic after registration
    // This prevents a 401 console error when the page redirects to "/"
    await page.route('**/api/auth/session', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ 
          status: 200, 
          contentType: 'application/json',
          body: JSON.stringify({ authenticated: true, user: mockUser }) 
        });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
      }
    });

    await page.getByPlaceholder('Seu nome').fill('Test User');
    await page.getByPlaceholder('seu@email.com').fill('test@example.com');
    await page.getByPlaceholder('••••••••').fill('securepassword123');

    await page.getByRole('button', { name: /Criar conta/i }).click();

    // Sonner toast check
    await expect(page.locator('body')).toContainText('Cadastro realizado com sucesso!', { timeout: 10000 });
    
    await page.waitForURL('**/', { timeout: 10000 });
  });

  test('TC-06: Error Treatment - Should display toast for already registered email (409)', async ({ page }) => {
    await page.route('**/auth/register', async route => {
      await route.fulfill({ 
        status: 409, 
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Este email já está cadastrado' }) 
      });
    });

    await page.getByPlaceholder('Seu nome').fill('Test User');
    await page.getByPlaceholder('seu@email.com').fill('duplicate@example.com');
    await page.getByPlaceholder('••••••••').fill('securepassword123');

    await page.getByRole('button', { name: /Criar conta/i }).click();

    await expect(page.locator('body')).toContainText('Este email já está cadastrado', { timeout: 10000 });
  });

  test('TC-07: Client-side Validation - Should display Zod validation errors', async ({ page }) => {
    await page.getByRole('button', { name: /Criar conta/i }).click();

    await expect(page.locator('body')).toContainText('O nome deve ter pelo menos 2 caracteres', { timeout: 10000 });
    await expect(page.locator('body')).toContainText('Email inválido', { timeout: 10000 });
    await expect(page.locator('body')).toContainText('A senha deve ter pelo menos 8 caracteres', { timeout: 10000 });
  });
});
