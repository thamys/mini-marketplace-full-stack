import { test, expect } from '@playwright/test';

const CUSTOMER_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwiZW1haWwiOiJjdXN0b21lckBleGFtcGxlLmNvbSIsInJvbGUiOiJDVVNUT01FUiJ9.signature";
const ADMIN_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbiBtYXJrZXRwbGFjZS5jb20iLCJyb2xlIjoiQURNSU4ifQ.signature";

test.describe('RBAC and Route Protection - US-07', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('TC-07.1: Unauthenticated user should be redirected from /orders to /login', async ({ page }) => {
    await page.goto('/orders');
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC-07.2: Unauthenticated user should be redirected from /admin to /login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC-07.3: Authenticated CUSTOMER should be redirected from /admin to /', async ({ page }) => {
    // Set customer cookie
    await page.context().addCookies([{
      name: 'auth_token',
      value: CUSTOMER_JWT,
      url: 'http://localhost:3000'
    }]);

    await page.goto('/admin');
    await expect(page).toHaveURL('/');
  });

  test('TC-07.4: Authenticated ADMIN should be allowed to access /admin', async ({ page }) => {
    // Set admin cookie
    await page.context().addCookies([{
      name: 'auth_token',
      value: ADMIN_JWT,
      url: 'http://localhost:3000'
    }]);

    await page.goto('/admin');
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('h1')).toContainText('Painel Administrativo');
  });

  test('TC-07.5: Authenticated user (any role) should be allowed to access /profile', async ({ page }) => {
    await page.context().addCookies([{
      name: 'auth_token',
      value: CUSTOMER_JWT,
      url: 'http://localhost:3000'
    }]);

    await page.goto('/profile');
    await expect(page).toHaveURL('/profile');
  });
});
