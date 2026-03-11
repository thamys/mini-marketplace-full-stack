'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';

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
    const handler = setTimeout(() => {
      handleFilterChange('search', search);
    }, 500);

    return () => clearTimeout(handler);
  }, [search, handleFilterChange]);



  return (
    <div className="flex flex-col gap-4 w-full md:w-auto">
      <div className="flex w-full max-w-sm items-center space-x-2">
        <Input 
          type="search" 
          placeholder="Buscar produtos..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-[300px]"
        />
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={currentCategory === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange('category', '')}
        >
          Todos
        </Button>
        {categories.map((cat) => (
          <Button 
            key={cat}
            variant={currentCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('category', cat)}
          >
            {cat}
          </Button>
        ))}
      </div>
    </div>
  );
}
