import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/api/products';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const priceFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(product.price));

  return (
    <article className="h-full">
      <Link 
        href={`/products/${product.id}`} 
        className="group h-full block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
        aria-label={`Ver detalhes do produto ${product.name}`}
      >
        <Card className="h-full flex flex-col overflow-hidden transition-all hover:shadow-lg dark:hover:shadow-zinc-800 p-0 border border-zinc-200 dark:border-zinc-800">
          <div className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900 border-b">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={`Foto do produto ${product.name}`}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-400" aria-hidden="true">
                Sem imagem
              </div>
            )}
          </div>
          
          <CardHeader className="flex-none p-4 pb-2">
            <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
              {product.category}
            </div>
            <h3 className="font-semibold text-lg line-clamp-2 leading-tight mt-1">
              {product.name}
            </h3>
          </CardHeader>
          
          <CardContent className="flex-1 p-4 pt-0">
            <p className="text-zinc-600 dark:text-zinc-300 text-sm line-clamp-2 mt-2">
              {product.description}
            </p>
          </CardContent>
          
          <CardFooter className="pt-0 flex flex-col items-center justify-center h-16 mt-auto p-0 m-0">
            <div className="w-full h-full flex flex-row justify-between items-center mb-1 px-4">
              <span className="text-xl font-bold" aria-label={`Preço: ${priceFormatted}`}>{priceFormatted}</span>
              <span className="text-xs text-center font-medium px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full" aria-label={`${product.stock} unidades em estoque`}>
                {product.stock} em estoque
              </span>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </article>
  );
}
