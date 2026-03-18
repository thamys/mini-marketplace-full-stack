import { test, expect } from '@playwright/test';
import { setupAdminSession } from './helpers/auth';
import { MOCK_ORDER, MOCK_USER_CUSTOMER } from './fixtures';

const MOCK_ADMIN_ORDER = {
  ...MOCK_ORDER,
  user: {
    id: MOCK_USER_CUSTOMER.id,
    name: MOCK_USER_CUSTOMER.name,
    email: MOCK_USER_CUSTOMER.email,
  },
};

const MOCK_ADMIN_ORDER_COMPLETED = {
  ...MOCK_ADMIN_ORDER,
  id: 'order-completed',
  status: 'COMPLETED' as const,
};

test.describe('Admin — Gerenciamento de Pedidos', () => {
  test.beforeEach(async ({ page }) => {
    await setupAdminSession(page);

    // Mock GET /api/proxy/orders → lista de pedidos admin
    await page.route('**/api/proxy/orders', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([MOCK_ADMIN_ORDER, MOCK_ADMIN_ORDER_COMPLETED]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/orders', { waitUntil: 'domcontentloaded' });
    // Aguarda tabela de pedidos carregar
    await expect(page.getByRole('heading', { name: 'Gerenciamento de Pedidos' })).toBeVisible({
      timeout: 10000,
    });
  });

  test('TC-ADM-ORD-01: Tabela exibe pedidos com email do cliente, total e status', async ({
    page,
  }) => {
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 5000 });

    // Email do cliente visível
    await expect(page.locator('body')).toContainText(MOCK_USER_CUSTOMER.email);

    // Total formatado em BRL
    await expect(page.locator('body')).toContainText('R$');

    // Status Pendente do primeiro pedido
    await expect(page.locator('body')).toContainText('Pendente');

    // Status Concluído do segundo pedido
    await expect(page.locator('body')).toContainText('Concluído');
  });

  test('TC-ADM-ORD-02: Alterar status para COMPLETED exibe toast de sucesso', async ({ page }) => {
    // Mock PATCH /api/proxy/orders/:id/status → 200
    await page.route(`**/api/proxy/orders/${MOCK_ADMIN_ORDER.id}/status`, async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...MOCK_ADMIN_ORDER, status: 'COMPLETED' }),
        });
      } else {
        await route.continue();
      }
    });

    // Clicar no botão de ações do primeiro pedido (PENDING)
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.getByLabel('Ações do pedido').click();

    // Selecionar "Concluído" no dropdown
    await page.getByRole('menuitem', { name: 'Concluído' }).click();

    // Toast de sucesso
    await expect(page.locator('body')).toContainText('Status atualizado com sucesso!', {
      timeout: 5000,
    });
  });

  test('TC-ADM-ORD-03: Alterar status para CANCELLED exibe toast de sucesso', async ({ page }) => {
    // Mock PATCH /api/proxy/orders/:id/status → 200
    await page.route(`**/api/proxy/orders/${MOCK_ADMIN_ORDER.id}/status`, async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...MOCK_ADMIN_ORDER, status: 'CANCELLED' }),
        });
      } else {
        await route.continue();
      }
    });

    // Clicar no botão de ações do primeiro pedido (PENDING)
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.getByLabel('Ações do pedido').click();

    // Selecionar "Cancelado"
    await page.getByRole('menuitem', { name: 'Cancelado' }).click();

    // Toast de sucesso
    await expect(page.locator('body')).toContainText('Status atualizado com sucesso!', {
      timeout: 5000,
    });
  });

  test('TC-ADM-ORD-04: Erro ao alterar status exibe toast de erro', async ({ page }) => {
    // Mock PATCH retornando 500
    await page.route(`**/api/proxy/orders/${MOCK_ADMIN_ORDER.id}/status`, async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Internal Server Error' }),
        });
      } else {
        await route.continue();
      }
    });

    // Clicar no botão de ações do primeiro pedido
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.getByLabel('Ações do pedido').click();
    await page.getByRole('menuitem', { name: 'Concluído' }).click();

    // Toast de erro
    await expect(page.locator('body')).toContainText('Erro ao atualizar status.', {
      timeout: 5000,
    });
  });

  test('TC-ADM-ORD-05: Expandir itens do pedido exibe detalhes dos produtos', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first();

    // Clicar no botão de expandir itens (texto "X itens") — usa name parcial para distinguir do dropdown
    const expandButton = firstRow.getByRole('button', { name: /itens?/i });
    await expect(expandButton).toBeVisible({ timeout: 3000 });
    await expandButton.click();

    // Linha expandida com detalhes dos itens deve aparecer
    // Os itens do MOCK_ORDER têm productName
    await expect(page.locator('body')).toContainText(MOCK_ORDER.items[0].productName, {
      timeout: 3000,
    });
    await expect(page.locator('body')).toContainText(MOCK_ORDER.items[1].productName, {
      timeout: 3000,
    });
  });
});
