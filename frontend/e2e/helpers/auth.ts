import type { Page } from '@playwright/test';
import {
  MOCK_JWT_CUSTOMER,
  MOCK_JWT_ADMIN,
  MOCK_USER_CUSTOMER,
  MOCK_USER_ADMIN,
  MOCK_PAGINATED_PRODUCTS,
} from '../fixtures';

export async function setupCustomerSession(page: Page): Promise<void> {
  page.setDefaultTimeout(60000);
  await page.context().clearCookies();

  await page.context().addCookies([
    { name: 'auth_token', value: MOCK_JWT_CUSTOMER, url: 'http://localhost:3000' },
  ]);

  await page.route('**/api/auth/session', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ authenticated: true, user: MOCK_USER_CUSTOMER }),
      });
    } else {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    }
  });

  await page.route('**/api/products*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PAGINATED_PRODUCTS),
    });
  });
}

export async function setupAdminSession(page: Page): Promise<void> {
  page.setDefaultTimeout(60000);
  await page.context().clearCookies();

  await page.context().addCookies([
    { name: 'auth_token', value: MOCK_JWT_ADMIN, url: 'http://localhost:3000' },
  ]);

  await page.route('**/api/auth/session', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ authenticated: true, user: MOCK_USER_ADMIN }),
      });
    } else {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    }
  });
}

export async function setupUnauthenticatedSession(page: Page): Promise<void> {
  page.setDefaultTimeout(60000);
  await page.context().clearCookies();

  await page.route('**/api/auth/session', async (route) => {
    await route.fulfill({
      status: 401,
      body: JSON.stringify({ authenticated: false }),
    });
  });

  await page.route('**/api/products*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PAGINATED_PRODUCTS),
    });
  });
}
