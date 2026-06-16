import { Skeleton } from "@/components/ui/Skeleton";

// Skeleton genérico exibido durante o carregamento das páginas autenticadas.
export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-ink-800 bg-ink-900 p-6 shadow-soft"
          >
            <Skeleton className="h-11 w-11 rounded-xl" />
            <Skeleton className="mt-5 h-4 w-24" />
            <Skeleton className="mt-2 h-8 w-20" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-ink-800 bg-ink-900 shadow-soft">
        <div className="border-b border-ink-800 px-6 py-5">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex flex-col gap-4 px-6 py-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-2 w-32 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
