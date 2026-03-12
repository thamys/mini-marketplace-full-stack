import { test, expect } from '@playwright/test';

test.describe('Catalog Page - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Increase timeout for cold starts
    page.setDefaultTimeout(60000);

    // Default mock for session
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: false })
      });
    });

    // Default mock for products to avoid server-side errors on navigation
    await page.route('**/api/products*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          data: [], 
          meta: { total: 0, page: 1, limit: 12, totalPages: 0 } 
        })
      });
    });
  });

  test('TC-08.5.1: URL ?search=x → campo de busca pré-preenchido e lista filtrada', async ({ page }) => {
    const mockProducts = [
      { id: '1', name: 'Notebook Dell XPS 15', price: 9000, category: 'Informática', description: 'Powerful laptop', stock: 10, imageUrl: null }
    ];

    await page.route('**/api/products*', async route => {
      const url = new URL(route.request().url());
      if (url.searchParams.get('search') === 'Notebook') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            data: mockProducts, 
            meta: { total: 1, page: 1, limit: 12, totalPages: 1 } 
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [], meta: { total: 0, page: 1, limit: 12, totalPages: 0 } })
        });
      }
    });

    await page.goto('/?search=Notebook');

    // Wait for the products to load using standardized testid
    await expect(page.getByTestId('product-card').first()).toBeVisible({ timeout: 15000 });

    // Check search input value using standardized testid
    const searchInput = page.getByTestId('search-input').first();
    await expect(searchInput).toHaveValue('Notebook');

    // Verify first product contains "Notebook"
    await expect(page.getByTestId('product-card').first()).toContainText('Notebook', { ignoreCase: true });
  });

  test('TC-08.5.3: Empty state com busca sem resultados', async ({ page }) => {
    await page.route('**/api/products*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], meta: { total: 0, page: 1, limit: 12, totalPages: 0 } })
      });
    });

    await page.goto('/?search=nonexistent_xyz_123_random_unique');

    // Wait for loading to finish
    await expect(page.locator('h3', { hasText: 'Nenhum produto encontrado' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('p', { hasText: 'Tente alterar os termos de busca ou categoria.' })).toBeVisible();
  });

  test('TC-08.6.1: Clicar em um produto na listagem redireciona para a página de detalhes', async ({ page }) => {
    const mockProduct = { id: '1', name: 'Notebook Test', price: 9000, category: 'Informática', description: 'Powerful laptop', stock: 10, imageUrl: null };

    await page.route('**/api/products*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          data: [mockProduct], 
          meta: { total: 1, page: 1, limit: 12, totalPages: 1 } 
        })
      });
    });

    // Mock specific product details as well
    await page.route('**/api/products/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProduct)
      });
    });

    await page.goto('/');

    // Wait for the products to load
    await expect(page.getByTestId('product-card').first()).toBeVisible({ timeout: 15000 });

    const firstProduct = page.getByTestId('product-card').first();
    const productName = await firstProduct.locator('h3').innerText();

    // Click on the first product
    await firstProduct.click();

    // Verify it navigated to a product details page
    await expect(page).toHaveURL(/\/products\/1/);
    
    // Verify title matches
    await expect(page.locator('h1')).toHaveText(productName);
  });
});
