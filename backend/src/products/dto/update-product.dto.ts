import { z } from 'zod';
import { CreateProductDtoSchema } from './create-product.dto';

export const UpdateProductDtoSchema = CreateProductDtoSchema.partial();

export type UpdateProductDto = z.infer<typeof UpdateProductDtoSchema>;
