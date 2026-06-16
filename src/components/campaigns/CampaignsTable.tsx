"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Play,
  Pause,
  ChevronDown,
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
  Megaphone,
  Radio,
  Search,
} from "lucide-react";
import { CampaignStatusBadge, LeadStatusBadge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type {
  Campaign,
  CampaignStatus,
  CampaignWithCount,
  Lead,
} from "@/lib/supabase/types";
import { toggleCampaignStatus } from "@/app/(app)/campaigns/actions";
import { useLeadsRealtime } from "./useLeadsRealtime";

type StatusFilter = "all" | CampaignStatus;

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "active", label: "Ativas" },
  { value: "paused", label: "Pausadas" },
  { value: "draft", label: "Rascunho" },
  { value: "completed", label: "Concluídas" },
];

interface CampaignsTableProps {
  initialCampaigns: CampaignWithCount[];
  leadsByCampaign: Record<string, Lead[]>;
  // Realtime fica ativo apenas com Supabase configurado (fora do modo demo).
  realtimeEnabled?: boolean;
}

// Variantes do Framer Motion para revelar as linhas de leads em cascata (stagger)
const listVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export function CampaignsTable({
  initialCampaigns,
  leadsByCampaign,
  realtimeEnabled = false,
}: CampaignsTableProps) {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filtros de listagem
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Leads sincronizados em tempo real (atualizam status ao vivo).
  const { leadsMap, isLive } = useLeadsRealtime(leadsByCampaign, realtimeEnabled);

  // Ressincroniza as campanhas quando o servidor revalida (ex: após import).
  useEffect(() => {
    setCampaigns(initialCampaigns);
  }, [initialCampaigns]);

  // Realtime do status das campanhas (ex: o worker marca como 'completed').
  useEffect(() => {
    if (!realtimeEnabled) return;

    const supabase = createClient();
    const channel = supabase
      .channel("realtime:campaigns")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "campaigns" },
        (payload) => {
          const row = payload.new as Campaign | undefined;
          if (payload.eventType === "UPDATE" && row) {
            setCampaigns((prev) =>
              prev.map((c) => (c.id === row.id ? { ...c, status: row.status } : c))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [realtimeEnabled]);

  // Lista filtrada por busca (nome) e status
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return campaigns.filter((c) => {
      const matchesQuery = !q || c.name.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" || c.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [campaigns, query, statusFilter]);

  // Em modo realtime, as contagens são derivadas dos leads ao vivo;
  // em modo demonstração, usamos as contagens vindas do servidor/mock.
  const countsFor = (c: CampaignWithCount) => {
    if (!realtimeEnabled) {
      return {
        total: c.total_leads,
        sent: c.sent_count,
        failed: c.failed_count,
      };
    }
    const list = leadsMap[c.id] ?? [];
    return {
      total: list.length,
      sent: list.filter((l) => l.status === "sent").length,
      failed: list.filter((l) => l.status === "failed").length,
    };
  };

  const toggleStatus = (id: string, current: CampaignStatus) => {
    // Atualização otimista (UI responde imediatamente)
    const next: CampaignStatus = current === "active" ? "paused" : "active";
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: next } : c))
    );
    setPendingId(id);

    startTransition(async () => {
      const result = await toggleCampaignStatus(id, current);
      if (!result.ok) {
        // Reverte em caso de erro
        setCampaigns((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: current } : c))
        );
        toast({
          variant: "error",
          title: "Não foi possível atualizar",
          description: result.error ?? "Tente novamente.",
        });
      } else {
        toast({
          variant: "success",
          title: next === "active" ? "Campanha iniciada" : "Campanha pausada",
          description:
            next === "active"
              ? "Os disparos serão processados pelo worker."
              : "Os disparos foram pausados.",
        });
      }
      setPendingId(null);
    });
  };

  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-700 bg-ink-900 px-6 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-800 text-ink-400">
          <Megaphone className="h-6 w-6" />
        </span>
        <p className="font-medium text-ink-200">Nenhuma campanha criada</p>
        <p className="max-w-xs text-sm text-ink-400">
          Importe uma lista de leads para criar sua primeira campanha de
          disparo.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar: busca + filtro por status + selo ao vivo */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar campanha..."
            className="h-10 w-full rounded-xl border border-ink-700 bg-ink-900 pl-10 pr-3 text-sm text-white outline-none transition-colors placeholder:text-ink-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          {isLive && (
            <span className="mr-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
              <Radio className="h-3 w-3 animate-pulse" />
              Ao vivo
            </span>
          )}
          <div className="scrollbar-thin flex gap-1 overflow-x-auto">
            {statusFilters.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  "shrink-0 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
                  statusFilter === f.value
                    ? "bg-white text-ink-950"
                    : "bg-ink-900 text-ink-400 ring-1 ring-ink-800 hover:bg-ink-800 hover:text-ink-200"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-900 shadow-soft">
        {/* Cabeçalho da tabela (desktop) */}
        <div className="hidden grid-cols-[2fr_1fr_1.5fr_auto] items-center gap-4 border-b border-ink-800 bg-ink-850/60 px-6 py-3 text-xs font-medium uppercase tracking-wide text-ink-400 lg:grid">
          <span>Campanha</span>
          <span>Status</span>
          <span>Progresso</span>
          <span className="text-right">Ações</span>
        </div>

        {filtered.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-ink-400">
            Nenhuma campanha encontrada para os filtros aplicados.
          </p>
        ) : (
          <ul className="divide-y divide-ink-800">
            {filtered.map((c) => {
          const counts = countsFor(c);
          const progress = counts.total
            ? Math.round((counts.sent / counts.total) * 100)
            : 0;
          const isExpanded = expandedId === c.id;
          const leads = leadsMap[c.id] ?? [];
          const canToggle = c.status === "active" || c.status === "paused";
          const isRowPending = isPending && pendingId === c.id;

          return (
            <li key={c.id} className="transition-colors hover:bg-ink-800/40">
              {/* Linha principal */}
              <div className="grid grid-cols-1 gap-4 px-6 py-4 lg:grid-cols-[2fr_1fr_1.5fr_auto] lg:items-center">
                {/* Nome + leads */}
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-white">{c.name}</span>
                  <span className="flex items-center gap-1.5 text-sm text-ink-400">
                    <Users className="h-3.5 w-3.5" />
                    {counts.total} leads
                  </span>
                </div>

                {/* Status */}
                <div className="flex items-center">
                  <CampaignStatusBadge status={c.status} />
                </div>

                {/* Progresso */}
                <div className="flex items-center gap-3">
                  <div className="h-2 w-full max-w-[160px] overflow-hidden rounded-full bg-ink-800">
                    <motion.div
                      className="h-full rounded-full bg-brand-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-sm font-semibold text-ink-200">
                    {progress}%
                  </span>
                </div>

                {/* Ações */}
                <div className="flex items-center justify-start gap-2 lg:justify-end">
                  <button
                    type="button"
                    onClick={() => toggleStatus(c.id, c.status)}
                    disabled={!canToggle || isRowPending}
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                      c.status === "active"
                        ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    )}
                    title={
                      !canToggle
                        ? "Disponível apenas para campanhas ativas ou pausadas"
                        : undefined
                    }
                  >
                    {isRowPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : c.status === "active" ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {c.status === "active" ? "Pausar" : "Iniciar"}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleExpand(c.id)}
                    aria-expanded={isExpanded}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-ink-300 transition-colors hover:bg-ink-800 hover:text-white"
                  >
                    Leads
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Painel expansível com os leads vinculados (animado) */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key="leads"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden border-t border-ink-800 bg-ink-850/40"
                  >
                    <div className="px-6 py-4">
                      {leads.length === 0 ? (
                        <p className="py-6 text-center text-sm text-ink-400">
                          Nenhum lead vinculado a esta campanha ainda.
                        </p>
                      ) : (
                        <div className="scrollbar-thin max-h-[320px] overflow-auto">
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="text-xs uppercase tracking-wide text-ink-400">
                                <th className="py-2 pr-4 font-medium">Empresa</th>
                                <th className="py-2 pr-4 font-medium">Telefone</th>
                                <th className="py-2 pr-4 font-medium">Status</th>
                                <th className="py-2 font-medium">Observação</th>
                              </tr>
                            </thead>
                            {/* Linhas em cascata (stagger) com Framer Motion */}
                            <motion.tbody
                              variants={listVariants}
                              initial="hidden"
                              animate="visible"
                              className="divide-y divide-ink-800"
                            >
                              {leads.map((lead) => (
                                <motion.tr
                                  key={lead.id}
                                  variants={rowVariants}
                                  className="text-ink-300"
                                >
                                  <td className="py-2.5 pr-4 font-medium text-white">
                                    {lead.company_name}
                                  </td>
                                  <td className="py-2.5 pr-4 tabular-nums">
                                    {lead.phone_number}
                                  </td>
                                  <td className="py-2.5 pr-4">
                                    <LeadStatusBadge status={lead.status} />
                                  </td>
                                  <td className="py-2.5 text-ink-400">
                                    {lead.error_message ? (
                                      <span className="inline-flex items-center gap-1 text-brand-400">
                                        <XCircle className="h-3.5 w-3.5" />
                                        {lead.error_message}
                                      </span>
                                    ) : lead.status === "sent" ? (
                                      <span className="inline-flex items-center gap-1 text-emerald-400">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Entregue
                                      </span>
                                    ) : (
                                      "—"
                                    )}
                                  </td>
                                </motion.tr>
                              ))}
                            </motion.tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
