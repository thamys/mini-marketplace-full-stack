'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Pagination({ totalPages, currentPage }: { totalPages: number, currentPage: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  if (totalPages <= 1) return null;

  // Always show: first, [ellipsis], current-1, current, current+1, [ellipsis], last
  const getPages = (): (number | null)[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Middle window: clamp so it never overlaps with first/last
    const mid = Math.max(2, Math.min(currentPage, totalPages - 1));
    const prev = Math.max(2, mid - 1);
    const next = Math.min(totalPages - 1, mid + 1);

    const pages: (number | null)[] = [1];
    if (prev > 2) pages.push(null);
    // deduplicate in edge cases where prev/mid/next collapse against 1 or totalPages
    const middle = [...new Set([prev, mid, next])].filter(p => p > 1 && p < totalPages);
    pages.push(...middle);
    if (next < totalPages - 1) pages.push(null);
    pages.push(totalPages);

    return pages;
  };

  const pages = getPages();

  return (
    <div className="flex justify-center items-center gap-1 mt-8 flex-wrap">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => router.push(createPageURL(Math.max(1, currentPage - 1)))}
        disabled={currentPage <= 1}
        aria-label="Página anterior"
        data-testid="pagination-prev"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pages.map((page, i) =>
        page === null ? (
          <span key={`ellipsis-${i}`} className="w-9 text-center text-zinc-400 select-none" aria-label="Mais páginas">
            …
          </span>
        ) : (
          <Button
            key={page}
            type="button"
            variant={page === currentPage ? 'default' : 'outline'}
            size="icon"
            onClick={() => page !== currentPage && router.push(createPageURL(page))}
            aria-label={`Ir para página ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
            className={cn(page === currentPage && 'pointer-events-none')}
            data-testid={page === currentPage ? 'pagination-current' : undefined}
          >
            {page}
          </Button>
        ),
      )}

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => router.push(createPageURL(Math.min(totalPages, currentPage + 1)))}
        disabled={currentPage >= totalPages}
        aria-label="Próxima página"
        data-testid="pagination-next"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
