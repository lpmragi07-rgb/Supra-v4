// =============================================================================
// Supra V4 — Worker de Disparo (Evolution API) — multi-operador
// =============================================================================

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import {
  checkConnection,
  isEvolutionConfigured,
  sendWhatsAppMessage,
} from "./evolution.mjs";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const BATCH_SIZE = Number(process.env.BATCH_SIZE ?? 5);
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 5000);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "[worker] Faltam variáveis: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

if (!isEvolutionConfigured()) {
  console.error(
    "[worker] Faltam variáveis da Evolution API: EVOLUTION_API_URL, EVOLUTION_API_KEY."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...args) =>
  console.log(`[worker ${new Date().toISOString()}]`, ...args);

// Cache de instância por operador (evita consultas repetidas ao Supabase)
const instanceCache = new Map();

async function getInstanceForUser(userId) {
  if (instanceCache.has(userId)) {
    return instanceCache.get(userId);
  }

  const { data, error } = await supabase
    .from("whatsapp_connections")
    .select("instance_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    log(`Erro ao buscar instância do operador ${userId}:`, error.message);
    return null;
  }

  const instanceName = data?.instance_name ?? null;
  if (instanceName) {
    instanceCache.set(userId, instanceName);
  }
  return instanceName;
}

async function processLead(lead, instanceName) {
  const result = await sendWhatsAppMessage(lead, instanceName);

  const { error } = await supabase
    .from("leads")
    .update({
      status: result.ok ? "sent" : "failed",
      error_message: result.ok ? null : result.error,
    })
    .eq("id", lead.id);

  if (error) {
    log("Falha ao atualizar lead", lead.id, error.message);
    return;
  }

  log(
    `Lead ${lead.company_name} (${lead.phone_number}) -> ${
      result.ok ? "ENVIADO" : "FALHOU"
    }${result.ok ? "" : ` (${result.error})`}`
  );
}

async function runCycle() {
  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("id, name, user_id")
    .eq("status", "active");

  if (campaignsError) {
    log("Erro ao buscar campanhas:", campaignsError.message);
    return;
  }

  if (!campaigns || campaigns.length === 0) {
    log("Nenhuma campanha ativa. Aguardando...");
    return;
  }

  for (const campaign of campaigns) {
    const instanceName = await getInstanceForUser(campaign.user_id);

    if (!instanceName) {
      log(
        `Campanha "${campaign.name}": operador sem instância WhatsApp. Peça para conectar em /whatsapp.`
      );
      continue;
    }

    const connection = await checkConnection(instanceName);
    if (!connection.connected) {
      log(
        `Campanha "${campaign.name}" (${instanceName}): WhatsApp desconectado (${connection.state}).`
      );
      continue;
    }

    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("id, company_name, phone_number")
      .eq("campaign_id", campaign.id)
      .eq("status", "pending")
      .limit(BATCH_SIZE);

    if (leadsError) {
      log(`Erro ao buscar leads da campanha ${campaign.name}:`, leadsError.message);
      continue;
    }

    if (!leads || leads.length === 0) {
      const { count: totalLeads, error: countError } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaign.id);

      if (countError) {
        log(`Erro ao contar leads da campanha ${campaign.name}:`, countError.message);
        continue;
      }

      if ((totalLeads ?? 0) === 0) {
        log(`Campanha "${campaign.name}" sem leads — aguardando importação.`);
        continue;
      }

      const { count: sentCount } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaign.id)
        .eq("status", "sent");

      const { count: failedCount } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaign.id)
        .eq("status", "failed");

      await supabase
        .from("campaigns")
        .update({ status: "completed" })
        .eq("id", campaign.id);

      log(
        `Campanha "${campaign.name}" concluída (${sentCount ?? 0} enviados, ${failedCount ?? 0} falhas).`
      );
      continue;
    }

    log(
      `Processando ${leads.length} leads da campanha "${campaign.name}" [${instanceName}]...`
    );
    for (const lead of leads) {
      await processLead(lead, instanceName);
    }
  }
}

let running = true;
process.on("SIGINT", () => {
  log("Encerrando worker...");
  running = false;
});
process.on("SIGTERM", () => {
  running = false;
});

async function main() {
  log("Worker iniciado (Evolution API, multi-operador).", {
    BATCH_SIZE,
    POLL_INTERVAL_MS,
  });

  while (running) {
    try {
      await runCycle();
    } catch (err) {
      log("Erro inesperado no ciclo:", err);
    }
    await sleep(POLL_INTERVAL_MS);
  }

  log("Worker finalizado.");
  process.exit(0);
}

main();
