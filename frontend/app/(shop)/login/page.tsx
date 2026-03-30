'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, type LoginDto } from '@/lib/validations/auth';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { mapErrorMessage } from '@/lib/error-mapping';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import Link from 'next/link';

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const { login } = useAuth();

  const form = useForm<LoginDto>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { errors } = form.formState;

  const mutation = useMutation({
    mutationFn: async (data: LoginDto) => {
      const response = await api.post('/auth/login', data);
      return response.data;
    },
    onSuccess: async (data) => {
      await login(data.access_token, data.user);
      toast.success('Login realizado com sucesso!');
    },
    onError: (error: Error) => {
      setServerError(mapErrorMessage(error.message));
      toast.error('Ocorreu um erro');
    },
  });

  const onSubmit = (data: LoginDto) => {
    setServerError(null);
    mutation.mutate(data);
  };

  return (
    <div className="flex items-center justify-center py-8"
      style={{
        backgroundImage: `radial-gradient(circle, rgba(153,85,232,0.07) 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
    >
      <div className="w-full max-w-md animate-fade-up">
        <div className="text-center mb-6">
          <span className="font-display font-bold text-3xl gradient-brand-text">Marketplace</span>
        </div>
      <Card className="w-full shadow-[0_8px_40px_rgba(153,85,232,0.12),0_2px_8px_rgba(153,85,232,0.06)] border-[#9955E8]/10">
        <CardHeader className="space-y-1">
          <CardTitle className="font-display text-xl font-semibold flex justify-center">Bem-vindo de volta</CardTitle>
          <CardDescription className="text-center">Entre com suas credenciais para acessar o marketplace</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <Alert variant="destructive" data-testid="auth-error">
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        id="email"
                        placeholder="seu@email.com"
                        {...field}
                        className={errors.email ? 'border-destructive' : ''}
                        data-testid="email-input"
                      />
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
                      <Input
                        id="password"
                        type="password"
                        placeholder="******"
                        {...field}
                        className={errors.password ? 'border-destructive' : ''}
                        data-testid="password-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-[#9955E8] border-0 text-white hover:bg-[#8040D4] btn-brand-shadow font-display" disabled={mutation.isPending} data-testid="login-submit">
                {mutation.isPending ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Não tem uma conta?{' '}
            <Link href="/register" className="text-[#9955E8] hover:text-[#8040D4] font-medium transition-colors">
              Cadastrar-se
            </Link>
          </p>
        </CardFooter>
      </Card>
      </div>
    </div>
  );
}
