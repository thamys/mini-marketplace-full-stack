'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!user) {
    return null; // AuthContext redirects to login
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold" data-testid="profile-title">Perfil do Usuário</CardTitle>
          <CardDescription>Informações da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="text-lg">{user.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">ID</p>
            <p className="text-sm font-mono text-gray-400">{user.id}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Função</p>
            <p className="text-lg capitalize">{user.role}</p>
          </div>
          <Button onClick={logout} variant="destructive" className="w-full" data-testid="logout-button">
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
