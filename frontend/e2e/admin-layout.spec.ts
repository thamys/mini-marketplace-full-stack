import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Layout', () => {
  const adminToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBtYXJrZXRwbGFjZS5jb20iLCJyb2xlIjoiQURNSU4ifQ.signature";
  const adminUser = { id: '1', email: 'admin@marketplace.com', role: 'ADMIN' };

  test.beforeEach(async ({ page }) => {
    // Clear cookies
    await page.context().clearCookies();

    // Mock session
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: true, user: adminUser })
      });
    });

    // Mock products for dashboard
    await page.route('**/api/products*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [
          { id: '1', name: 'Prod 1', price: 10, stock: 5 },
          { id: '2', name: 'Prod 2', price: 20, stock: 10 }
        ] })
      });
    });

    // Mock orders for dashboard
    await page.route('**/api/orders*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { 
            id: 'ord1', 
            total: 30, 
            status: 'COMPLETED', 
            createdAt: new Date().toISOString(),
            user: { email: 'user@example.com' },
            items: []
          }
        ])
      });
    });

    // Set cookie
    await page.context().addCookies([{
      name: 'auth_token',
      value: adminToken,
      url: 'http://localhost:3000'
    }]);
  });

  test('should show sidebar and dashboard data', async ({ page }) => {
    await page.goto('/admin');
    
    // Check Sidebar
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.getByText('Gerenciar Produtos')).toBeVisible();
    await expect(page.getByText('Gerenciar Pedidos')).toBeVisible();
    
    // Check Dashboard Stats
    await expect(page.getByText('Produtos Cadastrados')).toBeVisible();
    await expect(page.getByText('2')).toBeVisible(); // From mock
    await expect(page.getByText('Receita Total')).toBeVisible();
    
    // Check Recent Orders Table
    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByText('user@example.com')).toBeVisible();
  });

  test('should show simplified header in admin pages', async ({ page }) => {
    await page.goto('/admin');
    
    // Full header has "Produtos" link, admin header shouldn't
    const productsLink = page.getByRole('link', { name: /Produtos/i });
    await expect(productsLink).not.toBeVisible();
    
    // Admin header has "ADMIN" badge or text
    await expect(page.getByText('ADMIN')).toBeVisible();
  });

  test('should redirect admin from / to /admin', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/admin');
  });
});
