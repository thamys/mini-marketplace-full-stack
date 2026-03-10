import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
