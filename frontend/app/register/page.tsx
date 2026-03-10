'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

const registerSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: RegisterValues) => {
      // Como o interceptor de reposta da api já trata erros (via throw error global) e parseia o JSON,
      // aqui o código fica minúsculo
      const response = await api.post('/auth/register', values);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Cadastro realizado com sucesso!');
      router.push('/');
    },
    onError: (error: Error & { status?: number }) => {
      if (error.status === 409) {
        form.setError('email', { type: 'manual', message: error.message });
      } else {
        setServerError(error.message);
      }
    },
  });

  function onSubmit(values: RegisterValues) {
    setServerError(null);
    mutation.mutate(values);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Cadastro</CardTitle>
          <CardDescription className="text-center">
            Crie sua conta no Mini Marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {serverError && (
                <div className="text-sm font-medium text-destructive mt-2 text-center">
                  {serverError}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Cadastrando...' : 'Criar conta'}
              </Button>

              <div className="text-center text-sm text-slate-500 mt-4">
                Já tem uma conta? <a href="/login" className="text-primary hover:underline">Entre aqui</a>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
