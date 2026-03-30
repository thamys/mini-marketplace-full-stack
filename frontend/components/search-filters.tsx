'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';

const toSlug = (str: string) =>
  str.normalize('NFD').replaceAll(/[\u0300-\u036f]/g, '').toLowerCase().replaceAll(/\s+/g, '-');

export function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const currentCategory = searchParams.get('category') || '';

  // Generic categories from seed
  const categories = ['Eletrônicos', 'Móveis', 'Informática', 'Eletrodomésticos', 'Esportes', 'Livros'];

  const handleFilterChange = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    if (key === 'search' || key === 'category') {
      params.delete('page');
    }

    router.push(`/?${params.toString()}`);
  }, [searchParams, router]);

  // Debounce search update
  useEffect(() => {
    // Only update if the search term changed and is different from the URL
    const params = new URLSearchParams(searchParams.toString());
    const currentSearch = params.get('search') || '';
    
    if (search === currentSearch) return;

    const handler = setTimeout(() => {
      handleFilterChange('search', search);
    }, 500);

    return () => clearTimeout(handler);
  }, [search, searchParams, handleFilterChange]);



  return (
    <div className="flex flex-col gap-4 w-full md:w-auto">
      <div className="flex w-full max-w-sm items-center space-x-2">
        <label htmlFor="search-input" className="sr-only">Buscar produtos</label>
        <Input
          id="search-input"
          type="search"
          placeholder="Buscar produtos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-[300px]"
          data-testid="search-input"
          aria-label="Buscar produtos por nome ou descrição"
        />
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar produtos por categoria">
        <Button
          variant={currentCategory === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange('category', '')}
          data-testid="category-filter-all"
          className={
            currentCategory === ''
              ? 'bg-[#9955E8] border-0 text-white hover:bg-[#8040D4] font-display shadow-[0_2px_10px_rgba(153,85,232,0.35)] transition-all duration-200'
              : 'font-display border-[#9955E8]/20 hover:border-[#9955E8]/50 hover:text-[#9955E8] transition-all duration-200'
          }
        >
          Todos
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={currentCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('category', cat)}
            data-testid={`category-filter-${toSlug(cat)}`}
            className={
              currentCategory === cat
                ? 'bg-[#9955E8] border-0 text-white hover:bg-[#8040D4] font-display shadow-[0_2px_10px_rgba(153,85,232,0.35)] transition-all duration-200'
                : 'font-display border-[#9955E8]/20 hover:border-[#9955E8]/50 hover:text-[#9955E8] transition-all duration-200'
            }
          >
            {cat}
          </Button>
        ))}
      </div>
    </div>
  );
}
