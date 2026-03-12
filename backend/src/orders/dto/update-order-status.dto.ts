import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

export const UpdateOrderStatusDtoSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export type UpdateOrderStatusDto = z.infer<typeof UpdateOrderStatusDtoSchema>;
