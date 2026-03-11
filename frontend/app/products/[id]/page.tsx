'use client';

import { getProductById } from '@/lib/api/products';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';

export default function ProductDetailsPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';

  const { data: product, isLoading: loading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id),
    enabled: !!id,
    retry: (failureCount, error) => {
      // Don't retry on 404
      if (error instanceof AxiosError && error.response?.status === 404) return false;
      return failureCount < 3;
    },
  });

  const errorNotFound = isError;

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-6">
        <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-square w-full rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>
          <div className="flex flex-col space-y-4">
            <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded mb-2"></div>
            <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded mb-4"></div>
            <div className="h-8 w-1/3 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded mb-6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (errorNotFound || !product) {
    return (
      <div className="container mx-auto py-20 px-4 text-center mt-10">
        <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
        <p className="mb-8 text-zinc-600">O produto que você está procurando não existe ou foi removido.</p>
        <Link href="/" className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700">
          Voltar para o Catálogo
        </Link>
      </div>
    );
  }

  const priceFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(product.price));

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <Link href="/" className="text-blue-600 hover:underline mb-8 inline-block">
        &larr; Voltar para o Catálogo
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900 border">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-400">
              Sem imagem
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="text-sm font-semibold tracking-wider text-zinc-500 uppercase mb-2">
            {product.category}
          </div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <p className="text-2xl font-semibold mb-6 text-blue-600 dark:text-blue-400">{priceFormatted}</p>
          
          <div className="prose dark:prose-invert mb-8">
            <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="mt-auto pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 font-medium">
                {product.stock > 0 ? `${product.stock} em estoque` : 'Fora de estoque'}
              </span>
            </div>
            
            <button 
              className="w-full md:w-auto px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
              disabled={product.stock <= 0}
            >
              Adicionar ao Carrinho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
