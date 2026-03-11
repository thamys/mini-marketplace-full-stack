import { Card, CardContent, CardHeader } from "./ui/card";

export function CatalogSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,350px))] gap-6 justify-center">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={`skeleton-${i}`} className="h-full flex flex-col overflow-hidden p-0 border border-zinc-200 dark:border-zinc-800 animate-pulse">
            <div className="aspect-square w-full bg-zinc-100 dark:bg-zinc-900" />
            <CardHeader className="flex-none p-4 pb-2 space-y-2">
              <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-6 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
            </CardHeader>
            <CardContent className="flex-1 p-4 pt-0 space-y-2">
              <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded mt-2" />
              <div className="h-4 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </CardContent>
            <div className="pt-0 flex flex-col items-center justify-center h-16 mt-auto p-0 m-0 border-t border-transparent">
              <div className="w-full h-full flex flex-row justify-between items-center mb-1 px-4">
                <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
