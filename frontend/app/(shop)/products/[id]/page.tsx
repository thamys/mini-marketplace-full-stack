'use client';

import React, { Suspense } from 'react';
import { getProductById } from '@/lib/api/products';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingCart, Plus, Minus, Check } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { cn } from '@/lib/utils';
import { ProductDetailSkeleton } from '@/components/skeletons/product-detail-skeleton';
import { ErrorBoundary } from 'react-error-boundary';

function ProductDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const { addItem, updateQuantity, items } = useCart();
  const [justAdded, setJustAdded] = React.useState(false);

  const { data: product } = useSuspenseQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id),
    retry: (failureCount, error: Error & { status?: number }) => {
      if (error?.status === 404) return false;
      return failureCount < 3;
    },
  });

  const priceFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(product.price));

  return (
    <div className="container mx-auto py-8 px-4">
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
                alt={`Foto do produto ${product.name}`}
                fill
                className="object-cover transition-opacity duration-300"
                priority
                onLoadingComplete={() => {
                  const overlay = document.getElementById(`detail-loading-overlay-${product.id}`);
                  if (overlay) overlay.style.opacity = '0';
                }}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div 
                id={`detail-loading-overlay-${product.id}`}
                className="absolute inset-0 bg-zinc-200 dark:bg-zinc-800 animate-pulse transition-opacity duration-500 pointer-events-none"
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-400" aria-hidden="true">
              Sem imagem
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <Badge className="w-fit mb-4" variant="secondary">
            {product.category}
          </Badge>
          <h1 className="text-4xl font-bold mb-4" data-testid="product-name">{product.name}</h1>
          <p className="text-2xl font-semibold mb-6 text-primary" aria-label={`Preço: ${priceFormatted}`} data-testid="product-price">
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
            <div className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
              <span className={`h-2 w-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} aria-hidden="true" />
              {product.stock > 0 ? (
                <span>{product.stock} unidades disponíveis em estoque</span>
              ) : (
                <span className="text-red-500 font-medium">Produto fora de estoque</span>
              )}
            </div>

            {(() => {
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
                    'w-full text-lg h-14 shadow-lg shadow-primary/20 gap-2 transition-all duration-300',
                    justAdded && 'bg-green-600 hover:bg-green-600 scale-[0.99]',
                  )}
                  disabled={product.stock === 0}
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
                  aria-label={product.stock > 0 ? `Adicionar ${product.name} ao carrinho` : `Produto ${product.name} indisponível`}
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
    <div className="container mx-auto py-20 px-4 text-center mt-10" data-testid="page-error">
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
