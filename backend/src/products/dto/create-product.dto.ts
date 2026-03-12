import { z } from 'zod';

export const CreateProductDtoSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().positive('Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  imageUrl: z.string().url('Invalid image URL').optional(),
});

export type CreateProductDto = z.infer<typeof CreateProductDtoSchema>;
