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
      <footer className="w-full" style={{ background: 'var(--brand-dark)' }}>
        <div className="container mx-auto max-w-7xl px-6 md:px-8 py-4 flex justify-center">
          <p className="text-xs text-white/40">
            © {currentYear} Marketplace. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="w-full" style={{ background: 'var(--brand-dark)' }}>
      <div className="container mx-auto max-w-7xl px-6 md:px-8 py-6 md:py-8">
        {/* Desktop: 3 colunas */}
        <div className="hidden md:grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-lg mb-4 gradient-brand-text">Marketplace</h3>
            <p className="text-sm text-white/70">
              Um projeto portfolio full-stack que demonstra práticas modernas de desenvolvimento web.
            </p>
          </div>

          <nav aria-label="Links Rápidos">
            <h4 className="font-semibold mb-4 text-white/90">Links Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-white/70 hover:text-[#7BFFAF] transition-colors underline-offset-4 hover:underline">
                  Produtos
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-white/70 hover:text-[#7BFFAF] transition-colors underline-offset-4 hover:underline">
                  Entrar
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-white/70 hover:text-[#7BFFAF] transition-colors underline-offset-4 hover:underline">
                  Registrar
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Conecte-se">
            <h4 className="font-semibold mb-4 text-white/90">Conecte-se</h4>
            <div className="flex gap-4">
              <a
                href="https://github.com/thamys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-[#7BFFAF] transition-colors focus-visible:ring-2 focus-visible:ring-[#7BFFAF] rounded p-1 -m-1"
                aria-label="Visite meu perfil no GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com/in/thamysferreira"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-[#7BFFAF] transition-colors focus-visible:ring-2 focus-visible:ring-[#7BFFAF] rounded p-1 -m-1"
                aria-label="Conecte-se comigo no LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </nav>
        </div>

        {/* Mobile: simplificado */}
        <div className="flex md:hidden items-center justify-between mb-4">
          <span className="font-semibold gradient-brand-text">Marketplace</span>
          <div className="flex gap-4">
            <a
              href="https://github.com/thamys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-[#7BFFAF] transition-colors focus-visible:ring-2 focus-visible:ring-[#7BFFAF] rounded p-1 -m-1"
              aria-label="Visite meu perfil no GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://linkedin.com/in/thamysferreira"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-[#7BFFAF] transition-colors focus-visible:ring-2 focus-visible:ring-[#7BFFAF] rounded p-1 -m-1"
              aria-label="Conecte-se comigo no LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 md:pt-6">
          <p className="text-xs text-white/60 text-center">
            © {currentYear} Projeto Portfolio.{' '}
            <Link
              href="https://github.com/thamys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-[#7BFFAF] transition-colors underline underline-offset-2"
            >
              Ver no GitHub
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
