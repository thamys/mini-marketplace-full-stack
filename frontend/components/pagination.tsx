'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from './ui/button';

export function Pagination({ totalPages, currentPage }: { totalPages: number, currentPage: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center mt-8 space-x-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => router.push(createPageURL(Math.max(1, currentPage - 1)))}
        disabled={currentPage <= 1}
        data-testid="pagination-prev"
      >
        Anterior
      </Button>
      <div className="flex items-center space-x-2 text-sm">
        Página {currentPage} de {totalPages}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => router.push(createPageURL(Math.min(totalPages, currentPage + 1)))}
        disabled={currentPage >= totalPages}
        data-testid="pagination-next"
      >
        Próximo
      </Button>
    </div>
  );
}
