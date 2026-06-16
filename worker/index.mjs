// =============================================================================
// Zuckerberg Prospect — Worker de Disparo (esqueleto)
// =============================================================================
// Worker EXTERNO e independente do front-end. Responsável por:
//   1. Buscar campanhas ATIVAS e seus leads com status 'pending'.
//   2. "Disparar" a mensagem (aqui simulado) e atualizar o status do lead
//      para 'sent' ou 'failed' (com error_message).
//   3. Concluir a campanha quando não houver mais leads pendentes.
//
// Usa a chave SERVICE_ROLE (ignora o RLS) — portanto roda SOMENTE no servidor.
// O front-end reflete cada atualização em tempo real (Supabase Realtime).
//
// Uso:
//   cd worker
//   cp .env.example .env   (preencha SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY)
//   npm install
//   npm start
// =============================================================================

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// ----------------------------------------------------------------------------
// Configuração (via variáveis de ambiente, com valores padrão sensatos)
// ----------------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const BATCH_SIZE = Number(process.env.BATCH_SIZE ?? 10); // leads por ciclo
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 5000); // pausa entre ciclos
const SEND_DELAY_MS = Number(process.env.SEND_DELAY_MS ?? 800); // simula latência do disparo
const FAILURE_RATE = Number(process.env.FAILURE_RATE ?? 0.1); // 10% de falha simulada

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "[worker] Faltam variáveis: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY. Copie .env.example para .env."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...args) => console.log(`[worker ${new Date().toISOString()}]`, ...args);

// ----------------------------------------------------------------------------
// Integração real do WhatsApp entra AQUI.
// Substitua esta simulação pela chamada à sua API (Cloud API, Z-API, etc.).
// Deve resolver { ok: boolean, error?: string }.
// ----------------------------------------------------------------------------
async function sendWhatsAppMessage(lead) {
  await sleep(SEND_DELAY_MS);

  const failed = Math.random() < FAILURE_RATE;
  if (failed) {
    return { ok: false, error: "Número inválido ou sem WhatsApp ativo" };
  }
  return { ok: true };
}

// Processa um único lead e persiste o resultado.
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
    `Lead ${lead.company_name} -> ${result.ok ? "ENVIADO" : "FALHOU"}${
      result.ok ? "" : ` (${result.error})`
    }`
  );
}

// Um ciclo: pega campanhas ativas, processa um lote de leads pendentes.
async function runCycle() {
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
      // Sem pendentes: marca a campanha como concluída.
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

// Loop principal com encerramento gracioso.
let running = true;
process.on("SIGINT", () => {
  log("Encerrando worker...");
  running = false;
});
process.on("SIGTERM", () => {
  running = false;
});

async function main() {
  log("Worker iniciado.", {
    BATCH_SIZE,
    POLL_INTERVAL_MS,
    SEND_DELAY_MS,
    FAILURE_RATE,
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
