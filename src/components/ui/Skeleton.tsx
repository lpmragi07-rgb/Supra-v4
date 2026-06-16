import { cn } from "@/lib/utils";

// Placeholder animado para estados de carregamento.
export function Skeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-ink-800", className)} />
  );
}
