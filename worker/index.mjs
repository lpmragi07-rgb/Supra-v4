// =============================================================================
// Supra V4 — Worker de Disparo (Evolution API)
// =============================================================================
// Worker EXTERNO e independente do front-end. Responsável por:
//   1. Buscar campanhas ATIVAS e seus leads com status 'pending'.
//   2. Disparar mensagens via Evolution API e atualizar status do lead.
//   3. Concluir a campanha quando não houver mais leads pendentes.
//
// Uso:
//   cd worker
//   cp .env.example .env
//   npm install
//   npm start
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
    "[worker] Faltam variáveis da Evolution API: EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE."
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

let whatsappConnected = false;

async function processLead(lead) {
  const result = await sendWhatsAppMessage(lead);

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
  const connection = await checkConnection();
  whatsappConnected = connection.connected;

  if (!connection.connected) {
    log(
      `WhatsApp desconectado (${connection.state}). Conecte em /whatsapp no app. Aguardando...`
    );
    return;
  }

  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("id, name")
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
      await supabase
        .from("campaigns")
        .update({ status: "completed" })
        .eq("id", campaign.id);
      log(`Campanha "${campaign.name}" concluída.`);
      continue;
    }

    log(`Processando ${leads.length} leads da campanha "${campaign.name}"...`);
    for (const lead of leads) {
      await processLead(lead);
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
  log("Worker iniciado (Evolution API).", {
    BATCH_SIZE,
    POLL_INTERVAL_MS,
    instance: process.env.EVOLUTION_INSTANCE,
  });

  const boot = await checkConnection();
  whatsappConnected = boot.connected;
  log(
    boot.connected
      ? `WhatsApp conectado (${boot.state}).`
      : `WhatsApp desconectado (${boot.state}). Conecte em /whatsapp.`
  );

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
