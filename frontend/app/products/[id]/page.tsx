'use client';

import { getProductById } from '@/lib/api/products';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : '';

  const { data: product, isLoading: loading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id),
    enabled: !!id,
    retry: (failureCount, error: Error & { status?: number }) => {
      // Don't retry on 404
      if (error?.status === 404) return false;
      return failureCount < 3;
    },
  });

  const errorNotFound = isError;

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <div className="h-10 w-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-square w-full rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse border"></div>
          <div className="flex flex-col space-y-4">
            <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded mb-2"></div>
            <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded mb-4"></div>
            <div className="h-8 w-1/3 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded mb-6"></div>
            <div className="h-32 w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 animate-pulse rounded-xl mb-8"></div>
          </div>
        </div>
      </div>
    );
  }

  if (errorNotFound || !product) {
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
            <Image
              src={product.imageUrl}
              alt={`Foto do produto ${product.name}`}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
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
            
            <Button 
              size="lg" 
              className="w-full text-lg h-14 shadow-lg shadow-primary/20" 
              disabled={product.stock === 0}
              aria-label={product.stock > 0 ? `Comprar ${product.name}` : `Produto ${product.name} indisponível`}
              data-testid="buy-button"
            >
              Comprar Agora
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
