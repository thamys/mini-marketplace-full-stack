import { z } from 'zod';

export const GetProductsDtoSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(1000).optional().default(100),
});

export type GetProductsDto = z.infer<typeof GetProductsDtoSchema>;
