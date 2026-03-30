'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Plus, Minus, Check, PackageX } from 'lucide-react';
import { Product } from '@/lib/api/products';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { useCart } from '@/lib/cart-context';
import React from 'react';
import { cn } from '@/lib/utils';
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

interface ProductCardProps {
  readonly product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, removeItem, updateQuantity, items } = useCart();
  const [justAdded, setJustAdded] = React.useState(false);
  const [confirmRemove, setConfirmRemove] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  const outOfStock = product.stock === 0;
  const cartItem = items.find((i) => i.productId === product.id);
  const inCart = !!cartItem;

  const priceFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(product.price));

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    addItem({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      stock: product.stock,
      imageUrl: product.imageUrl,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  }

  function handleIncrement(e: React.MouseEvent) {
    e.preventDefault();
    if (!cartItem) return;
    updateQuantity(product.id, cartItem.quantity + 1);
  }

  function handleDecrement(e: React.MouseEvent) {
    e.preventDefault();
    if (!cartItem) return;
    if (cartItem.quantity - 1 <= 0) {
      setConfirmRemove(true);
    } else {
      updateQuantity(product.id, cartItem.quantity - 1);
    }
  }

  return (
    <>
      <AlertDialog open={confirmRemove} onOpenChange={(open) => { if (!open) setConfirmRemove(false); }}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover item?</AlertDialogTitle>
            <AlertDialogDescription>
              {product.name} será removido do carrinho.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                removeItem(product.id);
                setConfirmRemove(false);
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <article className="h-full">
      <Link
        href={`/products/${product.id}`}
        className="group h-full block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
        aria-label={`Ver detalhes do produto ${product.name}${outOfStock ? ' (fora de estoque)' : ''}`}
        data-testid="product-card"
      >
        <Card className={cn(
          'h-full flex flex-col overflow-hidden p-0 border',
          outOfStock
            ? 'border-zinc-200 dark:border-zinc-800 opacity-75'
            : 'border-zinc-200 dark:border-zinc-800 card-lift',
        )}>
          <div className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900 border-b">
            {product.imageUrl ? (
              <div className="relative h-full w-full">
                <Image
                  src={product.imageUrl}
                  alt={`Foto do produto ${product.name}`}
                  fill
                  className={cn(
                    'object-cover transition-transform duration-500 ease-out',
                    outOfStock ? 'grayscale' : 'group-hover:scale-108',
                  )}
                  onLoad={() => setImageLoaded(true)}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-800 animate-pulse pointer-events-none" />
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-400" aria-hidden="true">
                Sem imagem
              </div>
            )}

            {outOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                <div className="flex flex-col items-center gap-1.5 text-white">
                  <PackageX className="h-8 w-8 drop-shadow" />
                  <span className="text-sm font-semibold drop-shadow tracking-wide">Fora de Estoque</span>
                </div>
              </div>
            )}
          </div>

          <CardHeader className="flex-none p-4 pb-2">
            <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
              {product.category}
            </div>
            <h3 className="font-display font-semibold text-base sm:text-lg line-clamp-2 leading-tight mt-1 break-words">
              {product.name}
            </h3>
          </CardHeader>

          <CardContent className="flex-1 p-4 pt-0">
            <p className="text-zinc-600 dark:text-zinc-300 text-sm line-clamp-2 mt-2">
              {product.description}
            </p>
          </CardContent>

          <CardFooter className="pt-0 flex flex-col gap-2 mt-auto p-4">
            <div className="w-full flex flex-row justify-between items-center">
              <span
                className={cn('text-xl font-bold font-display', outOfStock ? 'text-zinc-400 dark:text-zinc-500' : 'text-[#9955E8]')}
                aria-label={`Preço: ${priceFormatted}`}
              >
                {priceFormatted}
              </span>
              {outOfStock ? (
                <span
                  className="text-xs font-medium px-2 py-1 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full"
                  aria-label="Produto fora de estoque"
                >
                  Indisponível
                </span>
              ) : (
                <span
                  className="text-xs text-center font-medium px-2 py-1 bg-[#7BFFAF]/20 text-[#1A7A4A] dark:bg-[#7BFFAF]/15 dark:text-[#7BFFAF] rounded-full"
                  aria-label={`${product.stock} unidades em estoque`}
                >
                  {product.stock} em estoque
                </span>
              )}
            </div>

            {!outOfStock && inCart ? (
              <div
                className="w-full h-9 flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 animate-in fade-in-0 zoom-in-95 duration-200"
                onClick={(e) => e.preventDefault()}
              >
                <button
                  onClick={handleDecrement}
                  className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-primary/10 transition-colors shrink-0"
                  aria-label="Diminuir quantidade"
                  data-testid="decrement-button"
                >
                  <Minus className="h-3.5 w-3.5 text-primary" />
                </button>

                <div className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                  <ShoppingCart className="h-3.5 w-3.5" />
                  <span>{cartItem.quantity} no carrinho</span>
                </div>

                <button
                  onClick={handleIncrement}
                  disabled={cartItem.quantity >= (cartItem.stock ?? product.stock)}
                  className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-primary/10 disabled:opacity-30 transition-colors shrink-0"
                  aria-label="Aumentar quantidade"
                  data-testid="increment-button"
                >
                  <Plus className="h-3.5 w-3.5 text-primary" />
                </button>
              </div>
            ) : (
              <Button
                className={cn(
                  'w-full gap-2 transition-all duration-300 h-9 border-0',
                  outOfStock
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                    : 'bg-[#9955E8] text-white hover:bg-[#8040D4] btn-brand-shadow font-display',
                  justAdded && 'bg-[#7BFFAF]! text-[#0F0B1A]! hover:bg-[#5EEEA0]! shadow-none!',
                )}
                size="sm"
                disabled={outOfStock}
                onClick={handleAddToCart}
                aria-label={
                  outOfStock
                    ? `${product.name} fora de estoque`
                    : `Adicionar ${product.name} ao carrinho`
                }
                data-testid="add-to-cart-button"
              >
                {justAdded ? (
                  <>
                    <Check className="h-4 w-4 animate-in zoom-in-75 duration-150" />
                    Adicionado!
                  </>
                ) : outOfStock ? (
                  <>
                    <PackageX className="h-4 w-4" />
                    Fora de Estoque
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    Adicionar ao Carrinho
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </Link>
    </article>
    </>
  );
}
