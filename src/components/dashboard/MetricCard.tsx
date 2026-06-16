import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  // Tendência opcional (variação percentual) com sinal visual
  trend?: { value: string; positive: boolean };
  accent?: "brand" | "ink" | "red" | "sky";
}

const accentMap = {
  brand: "bg-brand-500/10 text-brand-500",
  ink: "bg-ink-800 text-ink-300",
  red: "bg-brand-500/10 text-brand-400",
  sky: "bg-sky-500/10 text-sky-400",
} as const;

export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = "brand",
}: MetricCardProps) {
  return (
    <Card className="group relative overflow-hidden p-6 transition-shadow duration-300 hover:shadow-soft-lg">
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl",
            accentMap[accent]
          )}
        >
          <Icon className="h-5 w-5" />
        </span>

        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              trend.positive
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-brand-500/10 text-brand-400"
            )}
          >
            {trend.positive ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {trend.value}
          </span>
        )}
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-ink-400">{label}</p>
        <p className="mt-1 font-serif text-3xl font-semibold tracking-tight text-white">
          {value}
        </p>
      </div>
    </Card>
  );
}
