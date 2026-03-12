'use client';

import { Suspense } from 'react';
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminOrders, updateOrderStatus, type AdminOrder, type OrderStatus } from '@/lib/api/orders';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, ChevronUp, MoreHorizontal, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import React from 'react';
import { cn } from '@/lib/utils';
import { AdminTableSkeleton } from '@/components/skeletons/admin-table-skeleton';

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Pendente',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

const STATUS_VARIANT: Record<OrderStatus, 'default' | 'secondary' | 'destructive'> = {
  PENDING: 'secondary',
  COMPLETED: 'default',
  CANCELLED: 'destructive',
};

const STATUS_OPTIONS: OrderStatus[] = ['PENDING', 'COMPLETED', 'CANCELLED'];
const COLUMNS = ['ID', 'Cliente', 'Data', 'Total', 'Status', 'Itens', 'Ações'];

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function OrderItemsRow({ order }: { order: AdminOrder }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <>
      <TableRow className="hover:bg-muted/30 transition-colors">
        <TableCell className="font-mono text-xs text-muted-foreground">
          #{order.id.slice(0, 8)}
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{order.user.name ?? '—'}</span>
            <span className="text-xs text-muted-foreground">{order.user.email}</span>
          </div>
        </TableCell>
        <TableCell>
          {new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(order.createdAt))}
        </TableCell>
        <TableCell className="font-semibold">{fmt.format(Number(order.total))}</TableCell>
        <TableCell>
          <Badge variant={STATUS_VARIANT[order.status]}>{STATUS_LABEL[order.status]}</Badge>
        </TableCell>
        <TableCell>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            aria-expanded={expanded}
          >
            {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </TableCell>
        <TableCell className="text-right">
          <StatusDropdown orderId={order.id} currentStatus={order.status} />
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow className="bg-muted/20">
          <TableCell colSpan={7} className="py-2 px-6">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b">
                  <th className="text-left pb-1 font-medium">Produto</th>
                  <th className="text-center pb-1 font-medium w-16">Qtd.</th>
                  <th className="text-right pb-1 font-medium">Preço un.</th>
                  <th className="text-right pb-1 font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-1 pr-4">{item.productName}</td>
                    <td className="py-1 text-center">{item.quantity}</td>
                    <td className="py-1 text-right">{fmt.format(Number(item.unitPrice))}</td>
                    <td className="py-1 text-right font-medium">
                      {fmt.format(Number(item.unitPrice) * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function StatusDropdown({ orderId, currentStatus }: { orderId: string; currentStatus: OrderStatus }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar status.');
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'h-9 w-9 p-0 hover:bg-muted focus:ring-1 focus:ring-primary rounded-lg transition-all inline-flex items-center justify-center cursor-pointer',
          mutation.isPending && 'opacity-50 pointer-events-none',
        )}
        aria-label="Ações do pedido"
      >
        <MoreHorizontal className="h-5 w-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Alterar status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {STATUS_OPTIONS.filter((s) => s !== currentStatus).map((status) => (
            <DropdownMenuItem
              key={status}
              onClick={() => mutation.mutate(status)}
              className="cursor-pointer gap-2"
            >
              <Badge variant={STATUS_VARIANT[status]} className="text-xs">
                {STATUS_LABEL[status]}
              </Badge>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function OrdersTableContent() {
  const { data: orders } = useSuspenseQuery({
    queryKey: ['admin-orders'],
    queryFn: getAdminOrders,
  });

  return (
    <div className="rounded-xl border bg-card shadow-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-28">ID</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Itens</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <ShoppingBag className="h-8 w-8 opacity-20" />
                  Nenhum pedido encontrado.
                </div>
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => <OrderItemsRow key={order.id} order={order} />)
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Gerenciamento de Pedidos
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize e atualize o status dos pedidos dos clientes.
          </p>
        </div>
      </div>

      <Suspense fallback={<AdminTableSkeleton columns={COLUMNS} />}>
        <OrdersTableContent />
      </Suspense>
    </div>
  );
}
