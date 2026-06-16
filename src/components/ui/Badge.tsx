import { cn } from "@/lib/utils";
import type { CampaignStatus, LeadStatus } from "@/lib/supabase/types";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

// Tons translúcidos sobre fundo escuro
const tones: Record<BadgeTone, string> = {
  neutral: "bg-ink-700/40 text-ink-300 ring-ink-600/50",
  success: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  danger: "bg-brand-500/10 text-brand-400 ring-brand-500/25",
  info: "bg-sky-500/10 text-sky-400 ring-sky-500/20",
};

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const campaignStatusMap: Record<
  CampaignStatus,
  { label: string; tone: BadgeTone }
> = {
  draft: { label: "Rascunho", tone: "neutral" },
  active: { label: "Ativa", tone: "success" },
  paused: { label: "Pausada", tone: "warning" },
  completed: { label: "Concluída", tone: "info" },
};

const leadStatusMap: Record<LeadStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Pendente", tone: "neutral" },
  sent: { label: "Enviado", tone: "success" },
  failed: { label: "Falhou", tone: "danger" },
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const { label, tone } = campaignStatusMap[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const { label, tone } = leadStatusMap[status];
  return <Badge tone={tone}>{label}</Badge>;
}
