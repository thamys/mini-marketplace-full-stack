import Link from 'next/link';
import { Github, Linkedin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background px-8">
      <div className="container max-w-screen-2xl py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
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

        <div className="border-t pt-8">
          <p className="text-xs text-muted-foreground text-center">
            © {currentYear} Projeto Portfolio. Este é um projeto full-stack de desenvolvimento web construído para demonstrar padrões arquiteturais modernos e melhores práticas.{' '}
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
