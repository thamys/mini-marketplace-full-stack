import { api, bffApi } from '../api';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string | number; // Decimal string from Prisma
  category: string;
  stock: number;
  imageUrl?: string;
  createdAt: string;
}

export interface ProductsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetProductsResponse {
  data: Product[];
  meta: ProductsMeta;
}

export async function getProducts(params?: {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}): Promise<GetProductsResponse> {
  const { data } = await api.get<GetProductsResponse>('/products', { params });
  return data;
}

export async function getProductById(id: string): Promise<Product> {
  const { data } = await api.get<Product>(`/products/${id}`);
  return data;
}

export async function createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
  const { data } = await bffApi.post<Product>('/products', product);
  return data;
}

export async function updateProduct(id: string, product: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product> {
  const { data } = await bffApi.put<Product>(`/products/${id}`, product);
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  await bffApi.delete(`/products/${id}`);
}
