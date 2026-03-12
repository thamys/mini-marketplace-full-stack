'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CartDrawer } from '@/components/cart/CartDrawer';

function getInitials(email: string): string {
  const [localPart] = email.split('@');
  return localPart
    .split('.')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Header() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
  };

  const initials = user ? getInitials(user.email) : '';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container px-8 flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="font-bold text-lg" aria-label="Marketplace - Ir para a página inicial">
          Marketplace
        </Link>

        <nav className="flex items-center gap-6" aria-label="Menu Principal">
          {loading && (
            <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
          )}
          
          <Link
            href="/"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Produtos
          </Link>

          {!loading && !user && (
            <>
              <Link
                href="/login"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Registrar
              </Link>
            </>
          )}

          {!loading && user && (
            <>
              {user.role === 'ADMIN' && (
                <>
                  <Link
                    href="/admin/products"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Gerenciar Produtos
                  </Link>
                  <Link
                    href="/admin/orders"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Gerenciar Pedidos
                  </Link>
                </>
              )}

              {user.role !== 'ADMIN' && (
                <Link
                  href="/orders"
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Meus Pedidos
                </Link>
              )}
            </>
          )}

          {(!user || user.role !== 'ADMIN') && (
            <CartDrawer />
          )}

          {!loading && user && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity">
                {initials}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
      </div>
    </header>
  );
}
