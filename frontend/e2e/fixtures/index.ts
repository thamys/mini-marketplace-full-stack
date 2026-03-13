// Tokens JWT válidos para jwt-decode (payload real, assinatura mock)
export const MOCK_JWT_CUSTOMER =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  Buffer.from(
    JSON.stringify({ sub: 'user-1', email: 'user@marketplace.com', name: 'Usuario Teste', role: 'CUSTOMER' }),
  )
    .toString('base64')
    .replace(/=/g, '') +
  '.signature';

export const MOCK_JWT_ADMIN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  Buffer.from(
    JSON.stringify({ sub: 'admin-1', email: 'admin@marketplace.com', name: 'Admin', role: 'ADMIN' }),
  )
    .toString('base64')
    .replace(/=/g, '') +
  '.signature';

export const MOCK_USER_CUSTOMER = {
  id: 'user-1',
  email: 'user@marketplace.com',
  name: 'Usuario Teste',
  role: 'CUSTOMER' as const,
};

export const MOCK_USER_ADMIN = {
  id: 'admin-1',
  email: 'admin@marketplace.com',
  name: 'Admin',
  role: 'ADMIN' as const,
};

export const MOCK_PRODUCT_1 = {
  id: 'prod-1',
  name: 'Notebook Dell',
  description: 'Um ótimo notebook',
  price: '2500.00',
  category: 'eletronicos',
  stock: 5,
  imageUrl: null as null,
  createdAt: new Date().toISOString(),
};

export const MOCK_PRODUCT_2 = {
  id: 'prod-2',
  name: 'Mouse Logitech',
  description: 'Mouse sem fio',
  price: '150.00',
  category: 'perifericos',
  stock: 10,
  imageUrl: null as null,
  createdAt: new Date().toISOString(),
};

export const MOCK_PRODUCT_OUT_OF_STOCK = {
  ...MOCK_PRODUCT_1,
  id: 'prod-oos',
  name: 'Produto Esgotado',
  stock: 0,
};

export const MOCK_ORDER = {
  id: 'order-abc123de',
  userId: MOCK_USER_CUSTOMER.id,
  total: '2650.00',
  status: 'PENDING' as const,
  createdAt: new Date().toISOString(),
  items: [
    {
      id: 'item-1',
      orderId: 'order-abc123de',
      productId: MOCK_PRODUCT_1.id,
      productName: MOCK_PRODUCT_1.name,
      quantity: 1,
      unitPrice: MOCK_PRODUCT_1.price,
    },
    {
      id: 'item-2',
      orderId: 'order-abc123de',
      productId: MOCK_PRODUCT_2.id,
      productName: MOCK_PRODUCT_2.name,
      quantity: 1,
      unitPrice: MOCK_PRODUCT_2.price,
    },
  ],
};

export const MOCK_PAGINATED_PRODUCTS = {
  data: [MOCK_PRODUCT_1, MOCK_PRODUCT_2],
  meta: { total: 2, page: 1, limit: 12, totalPages: 1 },
};

export const MOCK_EMPTY_PRODUCTS = {
  data: [],
  meta: { total: 0, page: 1, limit: 12, totalPages: 0 },
};
