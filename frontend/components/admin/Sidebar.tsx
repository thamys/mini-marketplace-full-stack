'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Store,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const menuItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Gerenciar Produtos',
    href: '/admin/products',
    icon: Package,
  },
  {
    title: 'Gerenciar Pedidos',
    href: '/admin/orders',
    icon: ShoppingBag,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="w-64 border-r bg-muted/30 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b">
        <Link href="/admin" className="font-bold text-xl flex items-center gap-2">
          Marketplace <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">Admin</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <Store className="h-4 w-4" />
          Voltar para a Loja
        </Link>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium hover:bg-destructive/10 text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
