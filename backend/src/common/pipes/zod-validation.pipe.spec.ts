import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';
import { CreateProductDtoSchema } from '../../products/dto/create-product.dto';

describe('ZodValidationPipe', () => {
  describe('com schema válido', () => {
    const schema = z.object({
      name: z.string().min(1, 'Name is required'),
      age: z.coerce.number().int().min(0),
    });
    const pipe = new ZodValidationPipe(schema);

    it('retorna o valor transformado quando os dados são válidos', () => {
      const input = { name: 'Alice', age: 30 };
      const result = pipe.transform(input);
      expect(result).toEqual({ name: 'Alice', age: 30 });
    });

    it('não modifica campos que não estão no schema — Zod descarta por padrão', () => {
      const strictSchema = z.object({ name: z.string() });
      const strictPipe = new ZodValidationPipe(strictSchema);
      const result = strictPipe.transform({ name: 'Bob', extra: 'dropped' });
      expect((result as { name: string }).name).toBe('Bob');
    });

    it('converte tipos quando Zod faz coerção (ex: string → number)', () => {
      const coerceSchema = z.object({ age: z.coerce.number() });
      const coercePipe = new ZodValidationPipe(coerceSchema);
      const result = coercePipe.transform({ age: '25' });
      expect((result as { age: number }).age).toBe(25);
    });
  });

  describe('com schema inválido', () => {
    const schema = z.object({
      name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
      email: z.string().email('Email inválido'),
      age: z.number().min(0, 'Idade deve ser positiva'),
    });
    const pipe = new ZodValidationPipe(schema);

    it('lança BadRequestException com message "Validation failed"', () => {
      expect(() => pipe.transform({ name: 'X', email: 'bad', age: -1 })).toThrow(
        BadRequestException,
      );
    });

    it('a mensagem da exceção é "Validation failed"', () => {
      try {
        pipe.transform({});
        fail('Expected BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const response = (err as BadRequestException).getResponse() as {
          message: string;
          errors: Record<string, string[]>;
        };
        expect(response.message).toBe('Validation failed');
      }
    });

    it('inclui erros por campo em errors (Record<string, string[]>)', () => {
      try {
        pipe.transform({ name: 'X', email: 'bad-email', age: -1 });
        fail('Expected BadRequestException');
      } catch (err) {
        const response = (err as BadRequestException).getResponse() as {
          errors: Record<string, string[]>;
        };
        expect(response.errors).toHaveProperty('name');
        expect(Array.isArray(response.errors['name'])).toBe(true);
        expect(response.errors['email']).toBeDefined();
      }
    });

    it('lista múltiplos campos com erro simultaneamente', () => {
      try {
        pipe.transform({ name: 'X', email: 'not-an-email', age: -5 });
        fail('Expected BadRequestException');
      } catch (err) {
        const response = (err as BadRequestException).getResponse() as {
          errors: Record<string, string[]>;
        };
        const errorKeys = Object.keys(response.errors);
        expect(errorKeys.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('inclui mensagem descritiva por campo (não apenas "Required")', () => {
      try {
        pipe.transform({ name: 'X', email: 'bad', age: -1 });
        fail('Expected BadRequestException');
      } catch (err) {
        const response = (err as BadRequestException).getResponse() as {
          errors: Record<string, string[]>;
        };
        expect(response.errors['name'][0]).toContain('pelo menos 2');
      }
    });
  });

  describe('schema de produto real (CreateProductDtoSchema)', () => {
    const pipe = new ZodValidationPipe(CreateProductDtoSchema);

    it('valida payload de criação de produto completo', () => {
      const validProduct = {
        name: 'Notebook Dell',
        description: 'Excelente notebook',
        price: 5000,
        category: 'eletronicos',
        stock: 10,
        imageUrl: 'https://example.com/img.jpg',
      };
      const result = pipe.transform(validProduct);
      expect(result).toEqual(validProduct);
    });

    it('rejeita price negativo com mensagem específica', () => {
      try {
        pipe.transform({
          name: 'Prod',
          description: 'Desc',
          price: -10,
          category: 'Cat',
          stock: 1,
        });
        fail('Expected BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const response = (err as BadRequestException).getResponse() as {
          errors: Record<string, string[]>;
        };
        expect(response.errors['price']).toBeDefined();
        expect(response.errors['price'][0]).toContain('positive');
      }
    });

    it('rejeita name vazio com mensagem específica', () => {
      try {
        pipe.transform({
          name: '',
          description: 'Desc',
          price: 100,
          category: 'Cat',
          stock: 1,
        });
        fail('Expected BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const response = (err as BadRequestException).getResponse() as {
          errors: Record<string, string[]>;
        };
        expect(response.errors['name']).toBeDefined();
        expect(response.errors['name'][0]).toContain('required');
      }
    });
  });
});
