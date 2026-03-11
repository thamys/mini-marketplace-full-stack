'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/lib/api/products';
import { ProductCard } from '@/components/product-card';
import { SearchFilters } from '@/components/search-filters';
import { Pagination } from '@/components/pagination';

function CatalogContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || undefined;
  const category = searchParams.get('category') || undefined;
  const page = Number(searchParams.get('page')) || 1;
  const limit = 12;

  const { data: result, isLoading: loading, isError } = useQuery({
    queryKey: ['products', { search, category, page, limit }],
    queryFn: () => getProducts({ search, category, page, limit }),
    placeholderData: (previousData) => previousData,
  });

  if (isError) {
    return (
      <div className="text-center py-12 text-red-500 font-semibold">
        Erro ao carregar o catálogo de produtos.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="h-80 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-lg border"></div>
        ))}
      </div>
    );
  }

  if (!result || result.data.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="text-xl font-medium">Nenhum produto encontrado</h3>
        <p className="text-zinc-500 mt-2">Tente alterar os termos de busca ou categoria.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
        {result.data.map((product) => (
          <div key={product.id}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <Pagination totalPages={result.meta.totalPages} currentPage={result.meta.page} />
    </>
  );
}

export default function CatalogPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogo de Produtos</h1>
          <p className="text-muted-foreground mt-2">
            Navegue por nossa seleção de ofertas incríveis.
          </p>
        </div>

        <SearchFilters />

        <Suspense fallback={<div className="h-10 w-full animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded"></div>}>
          <CatalogContent />
        </Suspense>
      </div>
    </div>
  );
}
