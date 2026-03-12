import { bffApi, api } from '../api';

export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string | number;
}

export interface Order {
  id: string;
  userId: string;
  total: string | number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
}

export interface AdminOrder extends Order {
  user: { id: string; email: string; name: string | null };
}

export interface CreateOrderPayload {
  items: { productId: string; quantity: number }[];
}

export interface InsufficientStockDetail {
  productId: string;
  productName: string;
  requested: number;
  available: number;
}

export interface InsufficientStockError {
  error: 'INSUFFICIENT_STOCK';
  details: InsufficientStockDetail[];
}

export function isInsufficientStockError(err: unknown): err is Error & { response?: { data?: InsufficientStockError } } {
  if (!(err instanceof Error)) return false;
  const anyErr = err as Error & { status?: number; response?: { data?: { error?: string } } };
  return anyErr.status === 400 && anyErr.response?.data?.error === 'INSUFFICIENT_STOCK';
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const { data } = await bffApi.post<Order>('/orders', payload);
  return data;
}

export async function getOrders(): Promise<Order[]> {
  const { data } = await bffApi.get<Order[]>('/orders');
  return data;
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
  const { data } = await bffApi.get<AdminOrder[]>('/orders');
  return data;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const { data } = await bffApi.patch<Order>(`/orders/${id}/status`, { status });
  return data;
}

export async function getProductsStock(
  productIds: string[],
): Promise<Record<string, number>> {
  // Fetch each product to get current stock — uses public api
  const results = await Promise.all(
    productIds.map((id) =>
      api
        .get<{ id: string; stock: number }>(`/products/${id}`)
        .then((r) => ({ id: r.data.id, stock: r.data.stock }))
        .catch(() => ({ id, stock: 0 })),
    ),
  );
  return Object.fromEntries(results.map((r) => [r.id, r.stock]));
}
