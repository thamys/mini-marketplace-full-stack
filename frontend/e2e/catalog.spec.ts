import { test, expect } from '@playwright/test';

test.describe('Catalog Page - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC-08.5.1: URL ?search=x → campo de busca pré-preenchido e lista filtrada', async ({ page }) => {
    // Seeding includes "Notebook Dell XPS 15"
    await page.goto('/?search=Notebook');

    // Wait for the skeleton to disappear and products to load
    await expect(page.locator('.grid a.group').first()).toBeVisible({ timeout: 15000 });

    // Check search input value
    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput).toHaveValue('Notebook');

    // Verify at least one product is displayed
    const count = await page.locator('.grid a.group').count();
    expect(count).toBeGreaterThan(0);
    
    // Verify first product contains "Notebook"
    await expect(page.locator('.grid a.group').first().locator('h3')).toContainText('Notebook', { ignoreCase: true });
  });

  test('TC-08.5.3: Empty state com busca sem resultados', async ({ page }) => {
    await page.goto('/?search=nonexistent_xyz_123_random_unique');

    // Wait for loading to finish
    await expect(page.locator('h3', { hasText: 'Nenhum produto encontrado' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('p', { hasText: 'Tente alterar os termos de busca ou categoria.' })).toBeVisible();
  });

  test('TC-08.6.1: Clicar em um produto na listagem redireciona para a página de detalhes', async ({ page }) => {
    // Wait for the products to load
    await expect(page.locator('.grid a.group').first()).toBeVisible({ timeout: 15000 });

    const firstProduct = page.locator('.grid a.group').first();
    const productName = await firstProduct.locator('h3').innerText();

    // Click on the first product
    await firstProduct.click();

    // Verify it navigated to a product details page
    await expect(page).toHaveURL(/\/products\/[a-zA-Z0-9-]+/);
    
    // Verify title matches
    await expect(page.locator('h1')).toHaveText(productName);
  });
});
