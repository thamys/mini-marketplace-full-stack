'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Plus, Minus, Check } from 'lucide-react';
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
        aria-label={`Ver detalhes do produto ${product.name}`}
        data-testid="product-card"
      >
        <Card className="h-full flex flex-col overflow-hidden transition-all hover:shadow-lg dark:hover:shadow-zinc-800 p-0 border border-zinc-200 dark:border-zinc-800">
          <div className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900 border-b">
            {product.imageUrl ? (
              <div className="relative h-full w-full">
                <Image
                  src={product.imageUrl}
                  alt={`Foto do produto ${product.name}`}
                  fill
                  className={cn(
                    "object-cover transition-all duration-300 group-hover:scale-105",
                    "data-[loading=true]:scale-110 data-[loading=true]:blur-sm"
                  )}
                  onLoadingComplete={(img) => img.setAttribute('data-loading', 'false')}
                  data-loading="true"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div 
                  className="absolute inset-0 bg-zinc-200 dark:bg-zinc-800 animate-pulse transition-opacity duration-500 pointer-events-none"
                  id={`loading-overlay-${product.id}`}
                />
                <script
                  dangerouslySetInnerHTML={{
                    __html: `
                      (function() {
                        const img = document.currentScript.previousElementSibling.previousElementSibling.querySelector('img');
                        const overlay = document.currentScript.previousElementSibling;
                        if (img && img.complete) {
                          overlay.style.opacity = '0';
                        } else if (img) {
                          img.addEventListener('load', function() {
                            overlay.style.opacity = '0';
                          });
                        }
                      })();
                    `,
                  }}
                />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-400" aria-hidden="true">
                Sem imagem
              </div>
            )}
          </div>

          <CardHeader className="flex-none p-4 pb-2">
            <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
              {product.category}
            </div>
            <h3 className="font-semibold text-lg line-clamp-2 leading-tight mt-1">
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
              <span className="text-xl font-bold" aria-label={`Preço: ${priceFormatted}`}>
                {priceFormatted}
              </span>
              <span
                className="text-xs text-center font-medium px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full"
                aria-label={`${product.stock} unidades em estoque`}
              >
                {product.stock} em estoque
              </span>
            </div>

            {inCart ? (
              /* Quantity controls — same h-9 height as the Button size="sm" */
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
              /* Add to cart button */
              <Button
                className={cn(
                  'w-full gap-2 transition-all duration-300 h-9',
                  justAdded && 'bg-green-600 hover:bg-green-600 scale-[0.98]',
                )}
                size="sm"
                disabled={product.stock === 0}
                onClick={handleAddToCart}
                aria-label={
                  product.stock > 0
                    ? `Adicionar ${product.name} ao carrinho`
                    : `${product.name} fora de estoque`
                }
                data-testid="add-to-cart-button"
              >
                {justAdded ? (
                  <>
                    <Check className="h-4 w-4 animate-in zoom-in-75 duration-150" />
                    Adicionado!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    {product.stock > 0 ? 'Adicionar ao Carrinho' : 'Fora de Estoque'}
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
