"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { CampaignStatus } from "@/lib/supabase/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

// Alterna o status de uma campanha: draft/paused → active, active → paused.
// Ao reiniciar (completed → active), pode resetar os leads para pending.
export async function toggleCampaignStatus(
  campaignId: string,
  current: CampaignStatus,
  options?: { resetLeads?: boolean }
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: true };
  }

  const next: CampaignStatus =
    current === "active" ? "paused" : "active";

  const supabase = createClient();

  if (next === "active" && options?.resetLeads) {
    const { error: resetError } = await supabase
      .from("leads")
      .update({ status: "pending", error_message: null })
      .eq("campaign_id", campaignId);

    if (resetError) {
      return { ok: false, error: resetError.message };
    }
  }

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

// Remove campanha e leads vinculados (cascade no banco).
export async function deleteCampaign(campaignId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: true };
  }

  const supabase = createClient();
  const { error } = await supabase.from("campaigns").delete().eq("id", campaignId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/campaigns");
  revalidatePath("/");
  return { ok: true };
}
