'use client';

import React, { Suspense } from 'react';
import { getProductById } from '@/lib/api/products';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingCart, Plus, Minus, Check, PackageX } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { cn } from '@/lib/utils';
import { ProductDetailSkeleton } from '@/components/skeletons/product-detail-skeleton';
import { ErrorBoundary } from 'react-error-boundary';

function ProductDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const { addItem, updateQuantity, items } = useCart();
  const [justAdded, setJustAdded] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  const { data: product } = useSuspenseQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id),
    retry: (failureCount, error: Error & { status?: number }) => {
      if (error?.status === 404) return false;
      return failureCount < 3;
    },
  });

  const outOfStock = product.stock === 0;

  const priceFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(product.price));

  return (
    <div>
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2 focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Voltar para o catálogo"
          data-testid="back-button"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border">
          {product.imageUrl ? (
            <div className="relative h-full w-full">
              <Image
                src={product.imageUrl}
                alt={product.name ? `Foto do produto ${product.name}` : 'Imagem do produto'}
                fill
                className={cn('object-cover', outOfStock && 'grayscale')}
                priority
                onLoad={() => setImageLoaded(true)}
                sizes="(max-width: 768px) 100vw, 50vw"
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
            <div className="absolute inset-0 flex items-end justify-start p-4 bg-linear-to-t from-black/60 to-transparent">
              <div className="flex items-center gap-2 text-white">
                <PackageX className="h-5 w-5" />
                <span className="text-sm font-semibold tracking-wide">Fora de Estoque</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="w-fit" variant="secondary">
              {product.category}
            </Badge>
            {outOfStock && (
              <Badge variant="destructive" className="gap-1">
                <PackageX className="h-3 w-3" />
                Fora de Estoque
              </Badge>
            )}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-tight" data-testid="product-name">{product.name}</h1>
          <p
            className={cn('font-display text-2xl sm:text-3xl font-bold mb-6', outOfStock ? 'text-zinc-400 dark:text-zinc-500' : 'text-[#9955E8]')}
            aria-label={`Preço: ${priceFormatted}`}
            data-testid="product-price"
          >
            {priceFormatted}
          </p>

          <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-xl border border-zinc-100 dark:border-zinc-800 mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Descrição
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          <div className="mt-auto space-y-4">
            <div className="flex items-center gap-2 text-sm mb-4">
              <span className={cn('h-2 w-2 rounded-full', outOfStock ? 'bg-red-500' : 'bg-green-500')} aria-hidden="true" />
              {outOfStock ? (
                <span className="text-red-500 dark:text-red-400 font-medium">Produto fora de estoque</span>
              ) : (
                <span className="text-zinc-500">{product.stock} unidades disponíveis em estoque</span>
              )}
            </div>

            {outOfStock ? (
              <div className="w-full h-14 flex items-center justify-center gap-3 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 text-red-500 dark:text-red-400">
                <PackageX className="h-5 w-5" />
                <span className="font-medium">Indisponível no momento</span>
              </div>
            ) : (() => {
              const cartItem = items.find((i) => i.productId === product.id);
              if (cartItem) {
                return (
                  <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 h-14 animate-in fade-in-0 zoom-in-95 duration-200">
                    <button
                      onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-primary/10 transition-colors shrink-0"
                      aria-label="Diminuir quantidade"
                      data-testid="decrement-button"
                    >
                      <Minus className="h-4 w-4 text-primary" />
                    </button>
                    <div className="flex-1 flex items-center justify-center gap-2 font-semibold text-primary">
                      <ShoppingCart className="h-4 w-4" />
                      <span>{cartItem.quantity} no carrinho</span>
                    </div>
                    <button
                      onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                      disabled={cartItem.quantity >= (cartItem.stock ?? product.stock)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-primary/10 disabled:opacity-30 transition-colors shrink-0"
                      aria-label="Aumentar quantidade"
                      data-testid="increment-button"
                    >
                      <Plus className="h-4 w-4 text-primary" />
                    </button>
                  </div>
                );
              }
              return (
                <Button
                  size="lg"
                  className={cn(
                    'w-full font-display text-lg h-14 gap-2 transition-all duration-300 bg-[#9955E8] border-0 text-white hover:bg-[#8040D4] btn-brand-shadow',
                    justAdded && 'bg-[#7BFFAF]! text-[#0F0B1A]! shadow-none! scale-[0.99]',
                  )}
                  onClick={() => {
                    addItem({
                      productId: product.id,
                      name: product.name,
                      price: Number(product.price),
                      stock: product.stock,
                      imageUrl: product.imageUrl,
                    });
                    setJustAdded(true);
                    setTimeout(() => setJustAdded(false), 1200);
                  }}
                  aria-label={`Adicionar ${product.name} ao carrinho`}
                  data-testid="add-to-cart-button"
                >
                  {justAdded ? (
                    <>
                      <Check className="h-5 w-5 animate-in zoom-in-75 duration-150" />
                      Adicionado!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5" />
                      Adicionar ao Carrinho
                    </>
                  )}
                </Button>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductNotFound() {
  const router = useRouter();
  return (
    <div className="py-12 text-center" data-testid="page-error">
      <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
      <p className="mb-8 text-zinc-600">O produto que você está procurando não existe ou foi removido.</p>
      <Button onClick={() => router.push('/')} className="px-6 py-2">
        Voltar para o Catálogo
      </Button>
    </div>
  );
}

export default function ProductDetailsPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';

  return (
    <ErrorBoundary FallbackComponent={ProductNotFound}>
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetailContent id={id} />
      </Suspense>
    </ErrorBoundary>
  );
}
