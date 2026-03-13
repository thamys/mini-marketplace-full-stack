import { z } from 'zod';

export const CreateOrderItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
});

export const CreateOrderDtoSchema = z.object({
  items: z
    .array(CreateOrderItemSchema)
    .min(1, 'Order must have at least one item'),
});

export type CreateOrderDto = z.infer<typeof CreateOrderDtoSchema>;
export type CreateOrderItemDto = z.infer<typeof CreateOrderItemSchema>;
