export function ProductDetailSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <div className="h-10 w-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="aspect-square w-full rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse border" />
        <div className="flex flex-col space-y-4">
          <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded mb-2" />
          <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded mb-4" />
          <div className="h-8 w-1/3 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded mb-6" />
          <div className="h-32 w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 animate-pulse rounded-xl mb-8" />
        </div>
      </div>
    </div>
  );
}
