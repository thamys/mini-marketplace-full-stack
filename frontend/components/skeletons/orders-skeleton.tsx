export function OrdersSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-label="Carregando pedidos...">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 w-full animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
