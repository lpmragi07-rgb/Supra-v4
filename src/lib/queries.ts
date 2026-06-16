import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { CampaignWithCount, Lead } from "@/lib/supabase/types";

export interface DashboardData {
  totalLeads: number;
  sentCount: number;
  failedCount: number;
  conversionRate: number; // percentual (0-100)
  recentCampaigns: CampaignWithCount[];
  configured: boolean;
}

export interface CampaignsData {
  campaigns: CampaignWithCount[];
  leadsByCampaign: Record<string, Lead[]>;
  configured: boolean;
}

// Agrupa leads por campanha e calcula contagens por status.
function buildCampaignsWithCounts(
  campaigns: {
    id: string;
    user_id: string;
    name: string;
    status: CampaignWithCount["status"];
    created_at: string;
  }[],
  leads: Lead[]
): { withCounts: CampaignWithCount[]; byCampaign: Record<string, Lead[]> } {
  const byCampaign: Record<string, Lead[]> = {};
  for (const lead of leads) {
    (byCampaign[lead.campaign_id] ??= []).push(lead);
  }

  const withCounts: CampaignWithCount[] = campaigns.map((c) => {
    const list = byCampaign[c.id] ?? [];
    return {
      ...c,
      total_leads: list.length,
      sent_count: list.filter((l) => l.status === "sent").length,
      failed_count: list.filter((l) => l.status === "failed").length,
    };
  });

  return { withCounts, byCampaign };
}

// Busca campanhas + leads do usuário autenticado (RLS garante o isolamento).
export async function getCampaignsData(): Promise<CampaignsData> {
  if (!isSupabaseConfigured()) {
    return { campaigns: [], leadsByCampaign: {}, configured: false };
  }

  const supabase = createClient();

  const [{ data: campaigns }, { data: leads }] = await Promise.all([
    supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("leads").select("*").order("created_at", { ascending: true }),
  ]);

  const { withCounts, byCampaign } = buildCampaignsWithCounts(
    campaigns ?? [],
    (leads as Lead[]) ?? []
  );

  return {
    campaigns: withCounts,
    leadsByCampaign: byCampaign,
    configured: true,
  };
}

// Calcula as métricas do dashboard a partir das campanhas e leads.
export async function getDashboardData(): Promise<DashboardData> {
  const { campaigns, configured } = await getCampaignsData();

  const totalLeads = campaigns.reduce((acc, c) => acc + c.total_leads, 0);
  const sentCount = campaigns.reduce((acc, c) => acc + c.sent_count, 0);
  const failedCount = campaigns.reduce((acc, c) => acc + c.failed_count, 0);
  const conversionRate =
    totalLeads > 0 ? Math.round((sentCount / totalLeads) * 1000) / 10 : 0;

  return {
    totalLeads,
    sentCount,
    failedCount,
    conversionRate,
    recentCampaigns: campaigns.slice(0, 3),
    configured,
  };
}
