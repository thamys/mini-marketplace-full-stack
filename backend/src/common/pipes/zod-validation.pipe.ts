import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import type { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const formErrors = result.error.flatten().formErrors;
      
      throw new BadRequestException({
        message: 'Validation failed',
        errors,
        formErrors,
      });
    }

    return result.data;
  }
}
