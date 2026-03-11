'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from './ui/button';

export function Pagination({ totalPages, currentPage }: { totalPages: number, currentPage: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', pageNumber.toString());
    return `/?${params.toString()}`;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center mt-8 space-x-2">
      <Button
        variant="outline"
        onClick={() => router.push(createPageURL(Math.max(1, currentPage - 1)))}
        disabled={currentPage <= 1}
      >
        Anterior
      </Button>
      <div className="flex items-center space-x-2 text-sm">
        Página {currentPage} de {totalPages}
      </div>
      <Button
        variant="outline"
        onClick={() => router.push(createPageURL(Math.min(totalPages, currentPage + 1)))}
        disabled={currentPage >= totalPages}
      >
        Próximo
      </Button>
    </div>
  );
}
