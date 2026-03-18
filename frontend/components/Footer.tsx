'use client';

import Link from 'next/link';
import { Github, Linkedin } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const { user } = useAuth();

  const isAdmin = user?.role === 'ADMIN' || pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <footer className="border-t bg-background w-full">
        <div className="container mx-auto max-w-7xl px-6 md:px-8 py-4 flex justify-center">
          <p className="text-xs text-muted-foreground">
            © {currentYear} Marketplace. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t bg-background w-full">
      <div className="container mx-auto max-w-7xl px-6 md:px-8 py-6 md:py-8">
        {/* Desktop: 3 colunas */}
        <div className="hidden md:grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-lg mb-4">Marketplace</h3>
            <p className="text-sm text-muted-foreground">
              Um projeto portfolio full-stack que demonstra práticas modernas de desenvolvimento web.
            </p>
          </div>

          <nav aria-label="Links Rápidos">
            <h4 className="font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Produtos
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                  Entrar
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-muted-foreground hover:text-foreground transition-colors">
                  Registrar
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Conecte-se">
            <h4 className="font-semibold mb-4">Conecte-se</h4>
            <div className="flex gap-4">
              <a
                href="https://github.com/thamys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com/in/thamysferreira"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </nav>
        </div>

        {/* Mobile: simplificado */}
        <div className="flex md:hidden items-center justify-between mb-4">
          <span className="font-semibold">Marketplace</span>
          <div className="flex gap-4">
            <a
              href="https://github.com/thamys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://linkedin.com/in/thamysferreira"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="border-t pt-4 md:pt-6">
          <p className="text-xs text-muted-foreground text-center">
            © {currentYear} Projeto Portfolio.{' '}
            <Link
              href="https://github.com/thamys"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors underline"
            >
              Ver no GitHub
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
