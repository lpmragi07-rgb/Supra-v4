"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { CampaignStatus } from "@/lib/supabase/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

// Alterna o status de uma campanha entre 'active' e 'paused'.
// (RLS garante que o usuário só altere as próprias campanhas.)
export async function toggleCampaignStatus(
  campaignId: string,
  current: CampaignStatus
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    // Modo demonstração: nada a persistir.
    return { ok: true };
  }

  const next: CampaignStatus = current === "active" ? "paused" : "active";

  const supabase = createClient();
  const { error } = await supabase
    .from("campaigns")
    .update({ status: next })
    .eq("id", campaignId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/campaigns");
  revalidatePath("/");
  return { ok: true };
}
