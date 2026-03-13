// ---- User ----
export function userPayload(
  overrides: Partial<{ name: string; email: string; password: string }> = {},
) {
  return {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    ...overrides,
  };
}

// ---- Product ----
export function productPayload(
  overrides: Partial<{
    name: string;
    description: string;
    price: number;
    category: string;
    stock: number;
    imageUrl: string;
  }> = {},
) {
  return {
    name: 'Test Product',
    description: 'Test description',
    price: 100,
    category: 'Electronics',
    stock: 10,
    imageUrl: 'http://test.com/img.jpg',
    ...overrides,
  };
}

// ---- Order items ----
export function orderItemPayload(productId: string, quantity = 1) {
  return { productId, quantity };
}

export function createOrderPayload(items: { productId: string; quantity: number }[]) {
  return { items };
}
