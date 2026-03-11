import { test, expect } from '@playwright/test';

test.describe('Product Details Page - E2E Tests', () => {
  test('TC-08.7.1: Acessar a página de detalhes de um produto existente exibe suas informações corretas', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the products to load
    await expect(page.locator('.grid a.group').first()).toBeVisible({ timeout: 15000 });

    const firstProduct = page.locator('.grid a.group').first();
    const productName = await firstProduct.locator('h3').innerText();

    // Click on the first product
    await firstProduct.click();

    // Verify it navigated to a product details page
    await expect(page).toHaveURL(/\/products\/[a-zA-Z0-9-]+/);
    
    // Verify title matches
    await expect(page.locator('h1')).toHaveText(productName, { timeout: 10000 });
    
    // Verify Add to Cart button exists
    await expect(page.locator('button', { hasText: 'Adicionar ao Carrinho' })).toBeVisible();
  });

  test('TC-08.7.2: Acessar a página de detalhes de um produto inexistente exibe mensagem de não encontrado', async ({ page }) => {
    // Using a valid UUID format but non-existent
    const fakeId = '00000000-0000-0000-0000-000000000000';
    await page.goto(`/products/${fakeId}`);

    // Wait for the loading to finish and error to appear
    await expect(page.locator('h1', { hasText: 'Produto não encontrado' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=O produto que você está procurando não existe ou foi removido.')).toBeVisible();
  });
});
