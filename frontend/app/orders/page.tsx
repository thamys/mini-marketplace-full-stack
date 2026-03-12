'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSuspenseQuery } from '@tanstack/react-query';
import { getOrders, type Order } from '@/lib/api/orders';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';
import React from 'react';
import { OrdersSkeleton } from '@/components/skeletons/orders-skeleton';

const STATUS_LABEL: Record<Order['status'], string> = {
  PENDING: 'Pendente',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

const STATUS_VARIANT: Record<Order['status'], 'default' | 'secondary' | 'destructive'> = {
  PENDING: 'secondary',
  COMPLETED: 'default',
  CANCELLED: 'destructive',
};

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = React.useState(false);

  const total = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(order.total));

  const date = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(order.createdAt));

  return (
    <div className="rounded-xl border bg-card" data-testid="order-card">
      <button
        className="w-full flex items-center justify-between p-4 md:p-6 text-left hover:bg-muted/50 transition-colors rounded-xl focus-visible:ring-2 focus-visible:ring-primary outline-none"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={`Pedido de ${date}, total ${total}`}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-muted-foreground">#{order.id.slice(0, 8)}</span>
            <Badge variant={STATUS_VARIANT[order.status]}>{STATUS_LABEL[order.status]}</Badge>
          </div>
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-semibold text-base">{total}</span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t px-4 pb-4 md:px-6 md:pb-6">
          <table className="w-full text-sm mt-4" aria-label="Itens do pedido">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="pb-2 font-medium">Produto</th>
                <th className="pb-2 font-medium text-center w-20">Qtd.</th>
                <th className="pb-2 font-medium text-right">Preço un.</th>
                <th className="pb-2 font-medium text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => {
                const unitPrice = Number(item.unitPrice);
                const subtotal = unitPrice * item.quantity;
                const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
                return (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{item.productName}</td>
                    <td className="py-2 text-center">{item.quantity}</td>
                    <td className="py-2 text-right">{fmt.format(unitPrice)}</td>
                    <td className="py-2 text-right font-medium">{fmt.format(subtotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OrdersContent() {
  const { data: orders } = useSuspenseQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
  });

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800">
        <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-medium">Nenhum pedido encontrado</h2>
        <p className="text-muted-foreground">Você ainda não realizou nenhuma compra.</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-8 px-2.5 transition-all hover:opacity-90"
        >
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <main className="container mx-auto py-8 px-4 md:px-6 max-w-3xl" aria-labelledby="orders-title">
      <div className="mb-8">
        <h1 id="orders-title" className="text-3xl font-bold tracking-tight">Meus Pedidos</h1>
        <p className="text-muted-foreground mt-2">Histórico de compras realizadas.</p>
      </div>

      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersContent />
      </Suspense>
    </main>
  );
}
