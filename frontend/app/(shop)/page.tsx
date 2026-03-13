'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSuspenseQuery } from '@tanstack/react-query';
import { getProducts } from '@/lib/api/products';
import { ProductCard } from '@/components/product-card';
import { SearchFilters } from '@/components/search-filters';
import { Pagination } from '@/components/pagination';
import { CatalogSkeleton } from '@/components/catalog-skeleton';
import { SearchFiltersSkeleton } from '@/components/skeletons/search-filters-skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';

function CatalogContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || undefined;
  const category = searchParams.get('category') || undefined;
  const page = Number(searchParams.get('page')) || 1;
  const limit = 12;

  const { data: result } = useSuspenseQuery({
    queryKey: ['products', { search, category, page, limit }],
    queryFn: () => getProducts({ search, category, page, limit }),
  });

  if (!result || result.data.length === 0) {
    return (
      <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800">
        <h3 className="text-xl font-medium">Nenhum produto encontrado</h3>
        <p className="text-zinc-500 mt-2">Tente alterar os termos de busca ou categoria.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 justify-center">
        {result.data.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <Pagination totalPages={result.meta.totalPages} currentPage={result.meta.page} />
    </div>
  );
}

function ErrorFallback({ resetErrorBoundary }: { resetErrorBoundary: () => void }) {
  return (
    <div className="text-center py-16 px-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20" data-testid="page-error">
      <div className="inline-flex items-center justify-center p-3 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Ops! Algo deu errado</h3>
      <p className="text-red-600 dark:text-red-400 mb-6 max-w-md mx-auto">
        Não conseguimos carregar o catálogo de produtos no momento. Por favor, tente novamente.
      </p>
      <Button 
        onClick={resetErrorBoundary}
        variant="destructive"
        className="gap-2"
      >
        <RefreshCcw className="h-4 w-4" />
        Tentar novamente
      </Button>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <main className="container mx-auto py-8 px-4 md:px-6" id="main-content" aria-labelledby="catalog-title">
      <div className="flex flex-col space-y-8">
        <div>
          <h1 id="catalog-title" className="text-3xl font-bold tracking-tight">Catálogo de Produtos</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Navegue por nossa seleção de ofertas incríveis.
          </p>
        </div>

        <Suspense fallback={<SearchFiltersSkeleton />}>
          <SearchFilters />
        </Suspense>

        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<CatalogSkeleton />}>
            <CatalogContent />
          </Suspense>
        </ErrorBoundary>
      </div>
    </main>
  );
}
