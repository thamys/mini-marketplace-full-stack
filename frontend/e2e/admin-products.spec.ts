import { test, expect } from '@playwright/test';
import { setupAdminSession } from './helpers/auth';
import { MOCK_PRODUCT_1, MOCK_PRODUCT_2, MOCK_PAGINATED_PRODUCTS } from './fixtures';

// Produto mockado para testar criação/edição
const MOCK_CREATED_PRODUCT = {
  ...MOCK_PRODUCT_1,
  id: 'prod-new',
  name: 'Produto Criado Teste',
  description: 'Descrição criada',
  price: '999.00',
  category: 'Eletrônicos',
  stock: 15,
};

test.describe('Admin — Gerenciamento de Produtos', () => {
  test.beforeEach(async ({ page }) => {
    await setupAdminSession(page);

    // Mock listagem de produtos para a página admin
    await page.route('**/api/products*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PAGINATED_PRODUCTS),
      });
    });

    await page.goto('/admin/products', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('admin-title')).toBeVisible({ timeout: 10000 });
  });

  test('TC-ADM-PROD-01: Criar produto — formulário válido exibe toast de sucesso', async ({
    page,
  }) => {
    // Mock POST /api/proxy/products → 201
    await page.route('**/api/proxy/products', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_CREATED_PRODUCT),
        });
      } else {
        await route.continue();
      }
    });

    // Abrir modal de criação
    await page.getByRole('button', { name: 'Novo Produto' }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Preencher campos obrigatórios
    await page.getByLabel('Nome do Produto').fill('Produto Criado Teste');
    await page.getByLabel('Descrição').fill('Descrição criada');

    // Preço — campo formatado em BRL: digitar "99900" = R$ 999,00
    await page.getByLabel('Preço (R$)').fill('');
    await page.getByLabel('Preço (R$)').type('99900');

    await page.getByLabel('Estoque').fill('15');

    // Categoria via Select
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Eletrônicos' }).click();

    // Submeter
    await page.getByRole('button', { name: 'Salvar Produto' }).click();

    // Toast de sucesso
    await expect(page.locator('body')).toContainText('Produto criado com sucesso!', {
      timeout: 5000,
    });

    // Modal fechado
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 });
  });

  test('TC-ADM-PROD-02: Criar produto — campos obrigatórios ausentes exibem erros de validação', async ({
    page,
  }) => {
    // Abrir modal de criação
    await page.getByRole('button', { name: 'Novo Produto' }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Submeter sem preencher campos
    await page.getByRole('button', { name: 'Salvar Produto' }).click();

    // Mensagens de erro de validação do Zod (via react-hook-form)
    await expect(page.locator('body')).toContainText('Nome é obrigatório', { timeout: 3000 });
    await expect(page.locator('body')).toContainText('Descrição é obrigatória', { timeout: 3000 });
    await expect(page.locator('body')).toContainText('Categoria é obrigatória', { timeout: 3000 });
  });

  test('TC-ADM-PROD-03: Editar produto — modal abre com dados pré-preenchidos', async ({
    page,
  }) => {
    // Abrir dropdown do primeiro produto e clicar em Editar
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.locator('button').last().click(); // DropdownMenuTrigger
    await page.getByRole('menuitem', { name: 'Editar' }).click();

    // Verificar que o modal abre com título "Editar Produto"
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('dialog')).toContainText('Editar Produto');

    // Campos pré-preenchidos com dados do produto
    const nameInput = page.getByLabel('Nome do Produto');
    await expect(nameInput).toHaveValue(MOCK_PRODUCT_1.name);
  });

  test('TC-ADM-PROD-04: Editar produto — alterar preço e salvar exibe toast de sucesso', async ({
    page,
  }) => {
    // Mock PUT /api/proxy/products/:id → 200
    await page.route(`**/api/proxy/products/${MOCK_PRODUCT_1.id}`, async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...MOCK_PRODUCT_1, price: '1999.00' }),
        });
      } else {
        await route.continue();
      }
    });

    // Abrir edição do primeiro produto
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.locator('button').last().click();
    await page.getByRole('menuitem', { name: 'Editar' }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Alterar preço (limpa e digita novo valor)
    const priceInput = page.getByLabel('Preço (R$)');
    await priceInput.fill('');
    await priceInput.type('199900');

    // Salvar
    await page.getByRole('button', { name: 'Salvar Produto' }).click();

    // Toast de sucesso
    await expect(page.locator('body')).toContainText('Produto atualizado com sucesso!', {
      timeout: 5000,
    });
  });

  test('TC-ADM-PROD-05: Excluir produto — exibe dialog de confirmação', async ({ page }) => {
    // Clicar no dropdown do primeiro produto e selecionar Excluir
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.locator('button').last().click();
    await page.getByRole('menuitem', { name: 'Excluir' }).click();

    // Dialog de confirmação deve aparecer
    await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('alertdialog')).toContainText('Você tem certeza absoluta?');

    // Deve conter o nome do produto
    await expect(page.getByRole('alertdialog')).toContainText(MOCK_PRODUCT_1.name);
  });

  test('TC-ADM-PROD-06: Excluir produto — confirmar exclusão exibe toast de sucesso', async ({
    page,
  }) => {
    let deleteRequestMade = false;

    // Mock DELETE /api/proxy/products/:id → 204
    await page.route(`**/api/proxy/products/${MOCK_PRODUCT_1.id}`, async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteRequestMade = true;
        await route.fulfill({ status: 204 });
      } else {
        await route.continue();
      }
    });

    // Abrir dropdown e clicar Excluir
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.locator('button').last().click();
    await page.getByRole('menuitem', { name: 'Excluir' }).click();
    await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 5000 });

    // Confirmar exclusão
    await page.getByRole('button', { name: 'Excluir' }).last().click();

    // Toast de sucesso
    await expect(page.locator('body')).toContainText('Produto excluído com sucesso!', {
      timeout: 5000,
    });
    expect(deleteRequestMade).toBe(true);
  });

  test('TC-ADM-PROD-07: Excluir produto — cancelar no dialog não remove o produto', async ({
    page,
  }) => {
    let deleteRequestMade = false;

    // Registrar qualquer DELETE que acontecer
    await page.route(`**/api/proxy/products/**`, async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteRequestMade = true;
        await route.fulfill({ status: 204 });
      } else {
        await route.continue();
      }
    });

    // Abrir dropdown e clicar Excluir
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.locator('button').last().click();
    await page.getByRole('menuitem', { name: 'Excluir' }).click();
    await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 5000 });

    // Cancelar
    await page.getByRole('button', { name: 'Cancelar' }).click();

    // Dialog fechado
    await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 3000 });

    // Produto ainda visível na tabela
    await expect(page.locator('table tbody tr').first()).toContainText(MOCK_PRODUCT_1.name);

    // Nenhum request DELETE foi disparado
    expect(deleteRequestMade).toBe(false);
  });
});
