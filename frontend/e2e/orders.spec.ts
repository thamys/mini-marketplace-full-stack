import { test, expect } from '@playwright/test';

const MOCK_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJlbWFpbCI6InVzZXJAbWFya2V0cGxhY2UuY29tIiwibmFtZSI6IlVzdWFyaW8gVGVzdGUiLCJyb2xlIjoiQ1VTVE9NRVIifQ.signature';

const MOCK_USER = {
  id: 'user-1',
  email: 'user@marketplace.com',
  name: 'Usuario Teste',
  role: 'CUSTOMER',
};

const MOCK_PRODUCT = {
  id: 'prod-1',
  name: 'Notebook Dell',
  description: 'Um ótimo notebook',
  price: '2500.00',
  category: 'eletronicos',
  stock: 5,
  imageUrl: null,
  createdAt: new Date().toISOString(),
};

const MOCK_PRODUCT_2 = {
  id: 'prod-2',
  name: 'Mouse Logitech',
  description: 'Mouse sem fio',
  price: '150.00',
  category: 'perifericos',
  stock: 10,
  imageUrl: null,
  createdAt: new Date().toISOString(),
};

const MOCK_ORDER = {
  id: 'order-abc123de',
  userId: 'user-1',
  total: '2650.00',
  status: 'PENDING',
  createdAt: new Date().toISOString(),
  items: [
    {
      id: 'item-1',
      orderId: 'order-abc123de',
      productId: MOCK_PRODUCT.id,
      productName: MOCK_PRODUCT.name,
      quantity: 1,
      unitPrice: '2500.00',
    },
    {
      id: 'item-2',
      orderId: 'order-abc123de',
      productId: MOCK_PRODUCT_2.id,
      productName: MOCK_PRODUCT_2.name,
      quantity: 1,
      unitPrice: '150.00',
    },
  ],
};

async function setupAuthenticatedSession(page: import('@playwright/test').Page) {
  page.setDefaultTimeout(60000);
  await page.context().clearCookies();

  await page.context().addCookies([
    { name: 'auth_token', value: MOCK_JWT, url: 'http://localhost:3000' },
  ]);

  await page.route('**/api/auth/session', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ authenticated: true, user: MOCK_USER }),
      });
    } else {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    }
  });

  await page.route('**/api/products*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [MOCK_PRODUCT, MOCK_PRODUCT_2],
        meta: { total: 2, page: 1, limit: 12, totalPages: 1 },
      }),
    });
  });

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
}

test.describe.fixme('Orders Flow (US-11 & US-12)', () => {
  test.fixme('TC-11.E2E.1: Fluxo completo - adicionar produtos, finalizar pedido e ver histórico', async ({
    page,
  }) => {
    await setupAuthenticatedSession(page);

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
    await setupAuthenticatedSession(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('add-to-cart-button').first().click();
    await expect(page.getByTestId('cart-button')).toContainText('1');

    // Reload — cart must persist via sessionStorage
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('cart-button')).toContainText('1');
  });

  test.fixme('TC-11.E2E.3: Conflito de estoque ao abrir o carrinho — quantidade auto-ajustada', async ({
    page,
  }) => {
    await setupAuthenticatedSession(page);

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

  test.fixme('TC-11.E2E.4: Race condition — erro INSUFFICIENT_STOCK do backend ao finalizar', async ({
    page,
  }) => {
    await setupAuthenticatedSession(page);

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
