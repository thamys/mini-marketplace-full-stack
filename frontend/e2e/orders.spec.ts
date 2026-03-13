import { test, expect } from '@playwright/test';
import {
  MOCK_PRODUCT_1,
  MOCK_PRODUCT_2,
  MOCK_ORDER,
} from './fixtures';
import { setupCustomerSession } from './helpers/auth';

const MOCK_PRODUCT = MOCK_PRODUCT_1;

test.describe('Orders Flow (US-11 & US-12)', () => {
  test('TC-11.E2E.1: Fluxo completo - adicionar produtos, finalizar pedido e ver histórico', async ({
    page,
  }) => {
    await setupCustomerSession(page);

    await page.route(`**/api/products/${MOCK_PRODUCT.id}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PRODUCT),
      });
    });

    await page.route(`**/api/products/${MOCK_PRODUCT_2.id}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PRODUCT_2),
      });
    });

    await page.route('**/api/proxy/orders', async (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_ORDER),
        });
      } else if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([MOCK_ORDER]),
        });
      } else {
        await route.continue();
      }
    });

    // 1. Ir ao catálogo e adicionar produto 1
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const addButtons = page.getByTestId('add-to-cart-button');
    await addButtons.first().click();

    // 2. Verificar badge do carrinho atualizado
    const cartButton = page.getByTestId('cart-button');
    await expect(cartButton).toContainText('1');

    // 3. Adicionar produto 2
    await addButtons.nth(1).click();
    await expect(cartButton).toContainText('2');

    // 4. Abrir o carrinho
    await cartButton.click();

    // 5. Verificar itens no drawer
    const cartItems = page.getByTestId('cart-item');
    await expect(cartItems).toHaveCount(2);

    // 6. Verificar botão de finalizar
    const checkoutButton = page.getByTestId('checkout-button');
    await expect(checkoutButton).toBeEnabled();

    // 7. Finalizar pedido
    await checkoutButton.click();

    // 8. Toast de sucesso
    await expect(page.locator('body')).toContainText('Pedido realizado com sucesso!', {
      timeout: 5000,
    });

    // 9. Redireciona para /orders
    await page.waitForURL('/orders', { timeout: 5000 });

    // 10. Pedido aparece no histórico
    const orderCard = page.getByTestId('order-card');
    await expect(orderCard).toHaveCount(1);
    await expect(orderCard.first()).toContainText('R$');
  });

  test('TC-11.E2E.2: Persistência do carrinho em sessionStorage após reload', async ({
    page,
  }) => {
    await setupCustomerSession(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('add-to-cart-button').first().click();
    await expect(page.getByTestId('cart-button')).toContainText('1');

    // Reload — cart must persist via sessionStorage
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('cart-button')).toContainText('1');
  });

  test('TC-11.E2E.3: Conflito de estoque ao abrir o carrinho — quantidade auto-ajustada', async ({
    page,
  }) => {
    await setupCustomerSession(page);

    // Product starts with stock=5, but when drawer opens stock=1
    await page.route(`**/api/products/${MOCK_PRODUCT.id}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...MOCK_PRODUCT, stock: 1 }),
      });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('add-to-cart-button').first().click();

    // Manually set quantity to 3 via sessionStorage before opening drawer
    await page.evaluate((productId) => {
      const cart = JSON.parse(sessionStorage.getItem('marketplace_cart') ?? '[]');
      const updated = cart.map((i: { productId: string }) =>
        i.productId === productId ? { ...i, quantity: 3 } : i,
      );
      sessionStorage.setItem('marketplace_cart', JSON.stringify(updated));
    }, MOCK_PRODUCT.id);

    // Open drawer — should detect stock conflict and show warning toast
    await page.getByTestId('cart-button').click();
    await expect(page.locator('body')).toContainText('ajustada', { timeout: 5000 });
  });

  test('TC-11.E2E.4: Race condition — erro INSUFFICIENT_STOCK do backend ao finalizar', async ({
    page,
  }) => {
    await setupCustomerSession(page);

    // When drawer opens, stock check must pass (no conflicts) so checkout-button is enabled
    await page.route(`**/api/products/${MOCK_PRODUCT.id}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...MOCK_PRODUCT, stock: 5 }),
      });
    });

    await page.route('**/api/proxy/orders', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 400,
            error: 'INSUFFICIENT_STOCK',
            details: [
              {
                productId: MOCK_PRODUCT.id,
                productName: MOCK_PRODUCT.name,
                requested: 1,
                available: 0,
              },
            ],
          }),
        });
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('add-to-cart-button').first().click();

    await page.getByTestId('cart-button').click();
    await page.getByTestId('checkout-button').click();

    // Error toast shown — user stays on same page (no navigation)
    await expect(page.locator('body')).toContainText('Estoque de', { timeout: 5000 });
    await expect(page).not.toHaveURL('/orders');
  });

  test('TC-11.E2E.5: Acesso a /orders sem login redireciona para /login', async ({ page }) => {
    page.setDefaultTimeout(60000);
    await page.context().clearCookies();
    await page.goto('/orders', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });
});
