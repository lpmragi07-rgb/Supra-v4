import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CampaignsTable } from "@/components/campaigns/CampaignsTable";
import { getCampaignsData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const { campaigns, leadsByCampaign, configured } = await getCampaignsData();

  return (
    <div className="flex flex-col gap-8">
      {/* Cabeçalho */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="kicker">Gestão</span>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
            Suas <span className="accent-italic">campanhas</span>
          </h1>
          <p className="mt-2 max-w-xl text-ink-400">
            Gerencie seus disparos, controle o ritmo e visualize os leads
            vinculados a cada campanha.
          </p>
        </div>
        <Link href="/upload">
          <Button size="lg">
            <Plus className="h-5 w-5" />
            Nova Campanha
          </Button>
        </Link>
      </header>

      {!configured && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Supabase não configurado. Defina as variáveis de ambiente para
          gerenciar suas campanhas.
        </div>
      )}

      <CampaignsTable
        initialCampaigns={campaigns}
        leadsByCampaign={leadsByCampaign}
        realtimeEnabled={configured}
      />
    </div>
  );
}
