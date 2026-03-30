'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';
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
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => { setMounted(true); }, []);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fecha menu ao navegar
  React.useEffect(() => { setMenuOpen(false); }, [pathname]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
  };

  const isAdmin = user?.role === 'ADMIN' || pathname.startsWith('/admin');
  const initials = user ? getInitials(user.email) : '';

  if (isAdmin) {
    return (
      <header
        className={`sticky top-0 z-50 w-full border-b border-white/10 transition-shadow duration-300 ${scrolled ? 'header-scrolled' : ''}`}
        style={{ background: 'var(--brand-dark)' }}
      >
        <div className="container mx-auto px-6 md:px-8 flex h-16 max-w-7xl items-center justify-between">
          <Link href="/" className="font-display font-bold text-lg gradient-brand-text" aria-label="Marketplace - Ir para a página inicial">
            Marketplace
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold bg-[#9955E8] text-white px-2 py-1 rounded">ADMIN</span>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full border-b border-white/10 transition-shadow duration-300 ${scrolled ? 'header-scrolled' : ''}`}
        style={{ background: 'var(--brand-dark)' }}
      >
        <div className="container mx-auto px-6 md:px-8 h-16 max-w-7xl flex items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr]">
          {/* Logo — esquerda */}
          <Link href="/" className="font-display font-bold text-lg md:justify-self-start gradient-brand-text" aria-label="Marketplace - Ir para a página inicial">
            Marketplace
          </Link>

          {/* Nav — centro (desktop only) */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Menu Principal">
            <Link href="/" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
              Produtos
            </Link>

            {!loading && !user && (
              <>
                <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                  Entrar
                </Link>
                <Link href="/register" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                  Registrar
                </Link>
              </>
            )}

            {!loading && user && user.role !== 'ADMIN' && (
              <Link href="/orders" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                Meus Pedidos
              </Link>
            )}
          </nav>

          {/* Ações — direita */}
          <div className="flex items-center gap-2 md:gap-3 md:justify-self-end">
            {/* Carrinho e avatar (desktop) */}
            <div className="hidden md:flex items-center gap-3">
              {(!user || user.role !== 'ADMIN') && <CartDrawer />}

              {!loading && user && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center justify-center w-10 h-10 rounded-full bg-[#9955E8] text-white font-semibold text-sm cursor-pointer hover:bg-[#8040D4] transition-colors">
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
            </div>

            {/* Carrinho (mobile — sempre visível) */}
            <div className="md:hidden">
              {(!user || user.role !== 'ADMIN') && <CartDrawer />}
            </div>

            {/* Hambúrguer (mobile) */}
            <button
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10 transition-colors text-white"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu — portal */}
      {mounted && menuOpen && createPortal(
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <nav
            className="fixed top-16 left-0 right-0 z-41 border-b border-white/10 shadow-xl px-6 py-4 flex flex-col gap-1"
            style={{ background: 'var(--brand-dark)' }}
            aria-label="Menu mobile"
          >
            <Link
              href="/"
              className="py-3 text-sm font-medium border-b border-white/10 text-white/70 hover:text-white transition-colors"
            >
              Produtos
            </Link>

            {!loading && !user && (
              <>
                <Link
                  href="/login"
                  className="py-3 text-sm font-medium border-b border-white/10 text-white/70 hover:text-white transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className="py-3 text-sm font-medium text-white/70 hover:text-white transition-colors"
                >
                  Registrar
                </Link>
              </>
            )}

            {!loading && user && user.role !== 'ADMIN' && (
              <Link
                href="/orders"
                className="py-3 text-sm font-medium border-b border-white/10 text-white/70 hover:text-white transition-colors"
              >
                Meus Pedidos
              </Link>
            )}

            {!loading && user && (
              <>
                <Link
                  href="/profile"
                  className="py-3 text-sm font-medium border-b border-white/10 text-white/70 hover:text-white transition-colors"
                >
                  Meu Perfil
                </Link>
                <button
                  onClick={handleLogout}
                  className="py-3 text-sm font-medium text-left text-red-400 hover:text-red-300 transition-colors"
                >
                  Sair
                </button>
              </>
            )}
          </nav>
        </>,
        document.body,
      )}
    </>
  );
}
