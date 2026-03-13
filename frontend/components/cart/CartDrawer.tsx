'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ShoppingCart, X, Minus, Plus, Trash2, AlertTriangle, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { createOrder, getProductsStock, isInsufficientStockError, type InsufficientStockDetail } from '@/lib/api/orders';
import { cn } from '@/lib/utils';

export function CartDrawer() {
  const [open, setOpen] = React.useState(false);
  const [checkingStock, setCheckingStock] = React.useState(false);
  const [placing, setPlacing] = React.useState(false);
  const [stockConflicts, setStockConflicts] = React.useState<Record<string, number>>({});
  const [pendingRemove, setPendingRemove] = React.useState<{ productId: string; name: string } | null>(null);

  const { items, totalItems, totalAmount, removeItem, updateQuantity, updateItemStock, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleClose = () => {
    setOpen(false);
    setStockConflicts({});
  };

  // When drawer opens, fetch fresh stock for all cart items
  const handleOpen = React.useCallback(async () => {
    setOpen(true);
    if (items.length === 0) return;

    setCheckingStock(true);
    try {
      const stockMap = await getProductsStock(items.map((i) => i.productId));
      const conflicts: Record<string, number> = {};

      for (const item of items) {
        const currentStock = stockMap[item.productId] ?? 0;
        if (currentStock !== item.stock) {
          updateItemStock(item.productId, currentStock);
        }
        if (currentStock < item.quantity) {
          conflicts[item.productId] = currentStock;
          if (currentStock === 0) {
            toast.warning(`"${item.name}" foi removido do carrinho pois está sem estoque.`);
            removeItem(item.productId);
          } else {
            toast.warning(
              `A quantidade de "${item.name}" foi ajustada para ${currentStock} por falta de estoque.`,
            );
            updateQuantity(item.productId, currentStock);
          }
        }
      }

      setStockConflicts(conflicts);
    } finally {
      setCheckingStock(false);
    }
  }, [items, updateItemStock, updateQuantity, removeItem]);

  const hasConflicts = Object.keys(stockConflicts).length > 0;

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;

    if (!user) {
      setOpen(false);
      router.push('/login');
      return;
    }

    setPlacing(true);
    try {
      await createOrder({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      clearCart();
      setOpen(false);
      toast.success('Pedido realizado com sucesso!');
      router.push('/orders');
    } catch (err: unknown) {
      if (isInsufficientStockError(err)) {
        const details: InsufficientStockDetail[] = err.response?.data?.details ?? [];
        const newConflicts: Record<string, number> = {};

        for (const conflict of details) {
          newConflicts[conflict.productId] = conflict.available;
          updateItemStock(conflict.productId, conflict.available);
          if (conflict.available === 0) {
            toast.error(`"${conflict.productName}" está sem estoque. Removido do carrinho.`);
            removeItem(conflict.productId);
          } else {
            toast.error(
              `Estoque de "${conflict.productName}" mudou para ${conflict.available} unidade(s). Carrinho atualizado.`,
            );
            updateQuantity(conflict.productId, conflict.available);
          }
        }
        setStockConflicts(newConflicts);
      } else {
        toast.error('Erro ao finalizar pedido. Tente novamente.');
      }
    } finally {
      setPlacing(false);
    }
  };

  const confirmRemove = (productId: string, name: string) => {
    setPendingRemove({ productId, name });
  };

  const handleDecrement = (productId: string, currentQty: number, name: string) => {
    if (currentQty - 1 <= 0) {
      confirmRemove(productId, name);
    } else {
      updateQuantity(productId, currentQty - 1);
    }
  };

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Confirm-remove AlertDialog */}
      <AlertDialog
        open={!!pendingRemove}
        onOpenChange={(isOpen) => { if (!isOpen) setPendingRemove(null); }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover item?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRemove?.name} será removido do carrinho.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingRemove) {
                  removeItem(pendingRemove.productId);
                  setPendingRemove(null);
                }
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cart trigger button */}
      <button
        onClick={handleOpen}
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none"
        aria-label={`Carrinho de compras${totalItems > 0 ? `, ${totalItems} item(s)` : ', vazio'}`}
        data-testid="cart-button"
      >
        <ShoppingCart className="h-5 w-5" />
        {totalItems > 0 && (
          <span
            className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-in zoom-in-75 duration-150"
            aria-hidden="true"
          >
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </button>

      {createPortal(
        <>
          {/* Overlay — rendered at body level to escape header stacking context */}
          {open && (
            <div
              className="fixed inset-0 z-[60] bg-black/50 animate-in fade-in-0 duration-200"
              onClick={handleClose}
              aria-hidden="true"
            />
          )}

          {/* Drawer */}
          <aside
            className={cn(
              'fixed top-0 right-0 z-[61] h-screen w-full max-w-[420px] bg-background shadow-2xl flex flex-col transition-transform duration-300 ease-in-out',
              open ? 'translate-x-0' : 'translate-x-full',
            )}
            aria-label="Carrinho de compras"
            role="dialog"
            aria-modal={open ? 'true' : undefined}
            aria-hidden={open ? undefined : 'true'}
          >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4 bg-background/95">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">
              Carrinho
              {totalItems > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  · {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                </span>
              )}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleClose}
            aria-label="Fechar carrinho"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {checkingStock ? (
            <div className="flex flex-col gap-3" aria-label="Verificando estoque...">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 w-full animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
              <div className="p-4 rounded-full bg-muted">
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Carrinho vazio</p>
                <p className="text-sm text-muted-foreground mt-1">Adicione produtos para continuar.</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleClose}>
                Continuar comprando
              </Button>
            </div>
          ) : (
            <ul className="space-y-3" aria-label="Itens no carrinho">
              {items.map((item) => {
                const hasConflict = stockConflicts[item.productId] !== undefined;
                return (
                  <li
                    key={item.productId}
                    className={cn(
                      'rounded-xl border bg-card p-4 transition-colors',
                      hasConflict
                        ? 'border-orange-300 bg-orange-50 dark:border-orange-700/60 dark:bg-orange-950/20'
                        : 'border-border',
                    )}
                    data-testid="cart-item"
                  >
                    {/* Name row */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p className="font-medium leading-snug flex-1 min-w-0 line-clamp-2">
                        {item.name}
                      </p>
                      <button
                        onClick={() => confirmRemove(item.productId, item.name)}
                        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors rounded p-1 -mr-1 -mt-0.5"
                        aria-label={`Remover ${item.name} do carrinho`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {hasConflict && (
                      <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 text-xs mb-2">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>Estoque insuficiente · Disponível: {stockConflicts[item.productId]}</span>
                      </div>
                    )}

                    {/* Price + quantity row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-0.5 border rounded-lg overflow-hidden bg-background">
                        <button
                          onClick={() => handleDecrement(item.productId, item.quantity, item.name)}
                          className="flex h-8 w-8 items-center justify-center hover:bg-muted transition-colors"
                          aria-label="Diminuir quantidade"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span
                          className="w-8 text-center text-sm font-semibold select-none"
                          aria-label={`Quantidade: ${item.quantity}`}
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="flex h-8 w-8 items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors"
                          aria-label="Aumentar quantidade"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-sm">{fmt.format(item.price * item.quantity)}</p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-muted-foreground">{fmt.format(item.price)} / un.</p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t px-5 py-4 space-y-3 bg-background">
            {/* Subtotal breakdown */}
            <div className="space-y-1.5 text-sm text-muted-foreground">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between">
                  <span className="truncate max-w-[220px]">
                    {item.name}
                    {item.quantity > 1 && <span className="ml-1 opacity-60">× {item.quantity}</span>}
                  </span>
                  <span>{fmt.format(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t font-semibold">
              <span>Total</span>
              <span className="text-base">{fmt.format(totalAmount)}</span>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={handlePlaceOrder}
              disabled={placing || checkingStock || hasConflicts}
              aria-label={hasConflicts ? 'Resolva os conflitos de estoque antes de finalizar' : user ? 'Finalizar pedido' : 'Entrar para finalizar pedido'}
              data-testid="checkout-button"
            >
              {placing ? 'Finalizando...' : user ? 'Finalizar Pedido' : 'Entrar para Finalizar'}
            </Button>

            {hasConflicts && (
              <p className="text-xs text-orange-600 dark:text-orange-400 text-center">
                Ajuste as quantidades antes de finalizar.
              </p>
            )}
          </div>
        )}
          </aside>
        </>,
        document.body,
      )}
    </>
  );
}
