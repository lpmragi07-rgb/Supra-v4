"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ParsedLead } from "@/lib/csv";

export interface ImportResult {
  ok: boolean;
  error?: string;
  campaignId?: string;
  inserted?: number;
  demo?: boolean;
}

// Limite de segurança para evitar payloads excessivos por importação.
const MAX_LEADS = 5000;

// Cria uma campanha e insere os leads vinculados (status inicial: pending).
// O RLS garante que tudo seja gravado sob o usuário autenticado.
export async function createCampaignWithLeads(
  name: string,
  rows: ParsedLead[]
): Promise<ImportResult> {
  const campaignName = name.trim();

  if (!campaignName) {
    return { ok: false, error: "Informe um nome para a campanha." };
  }
  if (rows.length === 0) {
    return { ok: false, error: "Nenhum lead válido para importar." };
  }
  if (rows.length > MAX_LEADS) {
    return {
      ok: false,
      error: `Limite de ${MAX_LEADS.toLocaleString("pt-BR")} leads por importação.`,
    };
  }

  // Modo demonstração: simula sucesso sem persistir.
  if (!isSupabaseConfigured()) {
    return { ok: true, demo: true, inserted: rows.length };
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sessão expirada. Faça login novamente." };
  }

  // 1) Cria a campanha
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .insert({ name: campaignName, status: "draft", user_id: user.id })
    .select("id")
    .single();

  if (campaignError || !campaign) {
    return {
      ok: false,
      error: campaignError?.message ?? "Falha ao criar a campanha.",
    };
  }

  // 2) Insere os leads vinculados
  const leadsPayload = rows.map((r) => ({
    campaign_id: campaign.id,
    company_name: r.company_name,
    phone_number: r.phone_number,
    status: "pending" as const,
  }));

  const { error: leadsError } = await supabase.from("leads").insert(leadsPayload);

  if (leadsError) {
    // Rollback manual: remove a campanha criada se os leads falharem.
    await supabase.from("campaigns").delete().eq("id", campaign.id);
    return { ok: false, error: leadsError.message };
  }

  revalidatePath("/campaigns");
  revalidatePath("/");

  return { ok: true, campaignId: campaign.id, inserted: rows.length };
}
