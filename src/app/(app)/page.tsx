import Link from "next/link";
import {
  Users,
  Send,
  AlertTriangle,
  TrendingUp,
  UploadCloud,
  ArrowRight,
  Megaphone,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RealtimeRefresher } from "@/components/dashboard/RealtimeRefresher";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CampaignStatusBadge } from "@/components/ui/Badge";
import { getDashboardData } from "@/lib/queries";
import { formatNumber } from "@/lib/utils";

// Páginas com dados do usuário são sempre dinâmicas (dependem da sessão).
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();

  const metrics = [
    {
      label: "Total de Leads",
      value: formatNumber(data.totalLeads),
      icon: Users,
      accent: "brand" as const,
    },
    {
      label: "Mensagens Enviadas",
      value: formatNumber(data.sentCount),
      icon: Send,
      accent: "sky" as const,
    },
    {
      label: "Falhas",
      value: formatNumber(data.failedCount),
      icon: AlertTriangle,
      accent: "red" as const,
    },
    {
      label: "Taxa de Conversão",
      value: `${data.conversionRate.toLocaleString("pt-BR")}%`,
      icon: TrendingUp,
      accent: "ink" as const,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Mantém as métricas ao vivo quando o Supabase está configurado */}
      <RealtimeRefresher enabled={data.configured} />

      {/* Cabeçalho da página */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="kicker">Visão geral</span>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
            Seu <span className="accent-italic">pipeline</span> em tempo real
          </h1>
          <p className="mt-2 max-w-xl text-ink-400">
            Acompanhe o desempenho da sua prospecção B2B via WhatsApp em tempo
            real.
          </p>
        </div>
        <Link href="/upload">
          <Button size="lg">
            <UploadCloud className="h-5 w-5" />
            Importar Leads
          </Button>
        </Link>
      </header>

      {!data.configured && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Supabase não configurado. Defina as variáveis de ambiente para carregar
          seus dados.
        </div>
      )}

      {/* Grade de métricas */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </section>

      {/* Campanhas recentes */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Campanhas recentes</CardTitle>
            <CardDescription>
              Atividade das suas últimas campanhas de disparo.
            </CardDescription>
          </div>
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-500 hover:text-brand-400"
          >
            Ver todas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {data.recentCampaigns.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-800 text-ink-400">
                <Megaphone className="h-6 w-6" />
              </span>
              <p className="font-medium text-ink-200">
                Nenhuma campanha ainda
              </p>
              <p className="max-w-xs text-sm text-ink-400">
                Importe sua primeira lista de leads para criar uma campanha.
              </p>
              <Link href="/upload">
                <Button variant="secondary" size="sm">
                  <UploadCloud className="h-4 w-4" />
                  Importar Leads
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {data.recentCampaigns.map((c) => {
                const progress = c.total_leads
                  ? Math.round((c.sent_count / c.total_leads) * 100)
                  : 0;
                return (
                  <li
                    key={c.id}
                    className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-white">
                          {c.name}
                        </span>
                        <CampaignStatusBadge status={c.status} />
                      </div>
                      <span className="text-sm text-ink-400">
                        {c.sent_count} de {c.total_leads} enviados
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-ink-800">
                        <div
                          className="h-full rounded-full bg-brand-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-sm font-semibold text-ink-200">
                        {progress}%
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
