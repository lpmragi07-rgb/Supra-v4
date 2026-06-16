// Cliente Evolution API v2 — multi-tenant (instância por operador).

const EVOLUTION_API_URL = (process.env.EVOLUTION_API_URL ?? "").replace(/\/$/, "");
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY ?? "";
const SEND_DELAY_MS = Number(process.env.SEND_DELAY_MS ?? 1200);

const DEFAULT_TEMPLATE =
  "Olá! Somos da Supra V4. Identificamos que a {{empresa}} pode se beneficiar das nossas soluções. Podemos conversar?";

export function isEvolutionConfigured() {
  return Boolean(EVOLUTION_API_URL && EVOLUTION_API_KEY);
}

export function normalizePhone(raw) {
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  if (digits.length >= 12) return digits;
  return null;
}

export function buildMessage(lead, template = process.env.WHATSAPP_MESSAGE_TEMPLATE) {
  const text = (template ?? DEFAULT_TEMPLATE).trim();
  return text
    .replace(/\{\{empresa\}\}/gi, lead.company_name)
    .replace(/\{\{telefone\}\}/gi, lead.phone_number)
    .replace(/\{empresa\}/gi, lead.company_name)
    .replace(/\{telefone\}/gi, lead.phone_number);
}

async function evolutionFetch(path, options = {}) {
  const url = `${EVOLUTION_API_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      apikey: EVOLUTION_API_KEY,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  let body = null;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    body = await res.json();
  } else {
    const text = await res.text();
    body = text ? { message: text } : null;
  }

  return { ok: res.ok, status: res.status, body };
}

export async function checkConnection(instanceName) {
  if (!isEvolutionConfigured()) {
    return { connected: false, state: "not_configured", error: "Evolution API não configurada" };
  }

  if (!instanceName) {
    return { connected: false, state: "error", error: "Instância WhatsApp não definida" };
  }

  const { ok, body } = await evolutionFetch(
    `/instance/connectionState/${instanceName}`
  );

  if (!ok) {
    const message =
      body?.response?.message?.[0] ??
      body?.error ??
      body?.message ??
      "Falha ao consultar status da instância";
    return { connected: false, state: "error", error: String(message), instance: instanceName };
  }

  const state = body?.instance?.state ?? body?.state ?? "unknown";
  return {
    connected: state === "open",
    state,
    instance: instanceName,
  };
}

export async function sendWhatsAppMessage(lead, instanceName) {
  if (!isEvolutionConfigured()) {
    return { ok: false, error: "Evolution API não configurada no worker (.env)" };
  }

  const number = normalizePhone(lead.phone_number);
  if (!number) {
    return { ok: false, error: "Telefone inválido — use DDD + número com código do país" };
  }

  const connection = await checkConnection(instanceName);
  if (!connection.connected) {
    return {
      ok: false,
      error: `WhatsApp desconectado (${connection.state}). Conecte em /whatsapp`,
    };
  }

  const text = buildMessage(lead);
  const { ok, status, body } = await evolutionFetch(
    `/message/sendText/${instanceName}`,
    {
      method: "POST",
      body: JSON.stringify({
        number,
        text,
        delay: SEND_DELAY_MS,
        linkPreview: false,
      }),
    }
  );

  if (!ok) {
    const message =
      body?.response?.message?.[0] ??
      body?.error ??
      body?.message ??
      `Erro HTTP ${status}`;
    return { ok: false, error: String(message) };
  }

  return { ok: true, messageId: body?.key?.id ?? null };
}
