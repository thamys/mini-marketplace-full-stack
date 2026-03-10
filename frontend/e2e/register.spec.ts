import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

test.describe('Register Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER CONSOLE: [${msg.type()}] ${msg.text()}`));
    await page.goto('/register');
    await expect(page.getByText('Cadastro', { exact: true })).toBeVisible();
  });

  test('Successful Registration - Toast and Redirect', async ({ page }) => {
    await page.route(`${BASE_URL}/auth/register`, async route => {
      await route.fulfill({ 
        status: 201, 
        contentType: 'application/json',
        body: JSON.stringify({ id: 1, name: 'Test User', email: 'test@example.com' }) 
      });
    });

    await page.getByPlaceholder('Seu nome').fill('Test User');
    await page.getByPlaceholder('seu@email.com').fill('test@example.com');
    await page.getByPlaceholder('••••••••').fill('securepassword123');

    await page.getByRole('button', { name: /Criar conta/i }).click();

    // Sonner toast check
    await expect(page.locator('body')).toContainText('Cadastro realizado com sucesso!', { timeout: 10000 });
    
    await page.waitForURL('**/', { timeout: 10000 });
  });

  test('Error Treatment - Email already registered (409)', async ({ page }) => {
    await page.route(`${BASE_URL}/auth/register`, async route => {
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

  test('Client-side Validation - Zod errors', async ({ page }) => {
    await page.getByRole('button', { name: /Criar conta/i }).click();

    await expect(page.locator('body')).toContainText('O nome deve ter pelo menos 2 caracteres', { timeout: 10000 });
    await expect(page.locator('body')).toContainText('Email inválido', { timeout: 10000 });
    await expect(page.locator('body')).toContainText('A senha deve ter pelo menos 8 caracteres', { timeout: 10000 });
  });
});

