import { test, expect } from '@playwright/test';

test.describe('Product Details Page - E2E Tests', () => {
  test('TC-08.7.1: Acessar a página de detalhes de um produto existente exibe suas informações corretas', async ({ page }) => {
    const mockProduct = { id: '1', name: 'Notebook Test', price: 9000, category: 'Informática', description: 'Powerful laptop', stock: 10, imageUrl: null };

    // Mock products for the home page (if redirect/initial visit)
    await page.route('**/api/products', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          data: [mockProduct], 
          meta: { total: 1, page: 1, limit: 12, totalPages: 1 } 
        })
      });
    });

    // Mock specific product details
    await page.route('**/api/products/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProduct)
      });
    });

    await page.goto('/products/1');
    
    // Verify title matches using standardized testid
    await expect(page.getByTestId('product-name')).toHaveText(mockProduct.name, { timeout: 15000 });
    
    // Verify Buy button exists using standardized testid
    await expect(page.getByTestId('buy-button')).toBeVisible();
  });

  test('TC-08.7.2: Acessar a página de detalhes de um produto inexistente exibe mensagem de não encontrado', async ({ page }) => {
    // Using a valid UUID format but non-existent
    const fakeId = '00000000-0000-0000-0000-000000000000';

    await page.route(`**/api/products/${fakeId}`, async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Product not found' })
      });
    });

    await page.goto(`/products/${fakeId}`);

    // Wait for the loading to finish and error to appear using standardized testid
    const errorAlert = page.getByTestId('page-error');
    await expect(errorAlert).toBeVisible({ timeout: 15000 });
    await expect(errorAlert.locator('h1')).toHaveText('Produto não encontrado');
    await expect(errorAlert).toContainText('O produto que você está procurando não existe ou foi removido.');
  });
});
