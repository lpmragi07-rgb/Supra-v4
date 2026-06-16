// Cliente Evolution API (uso exclusivo no servidor — nunca importar em Client Components).

const EVOLUTION_API_URL = (process.env.EVOLUTION_API_URL ?? "").replace(/\/$/, "");
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY ?? "";
const EVOLUTION_GLOBAL_KEY = process.env.EVOLUTION_GLOBAL_KEY ?? EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE ?? "supra-v4";

export type EvolutionConnectionState =
  | "open"
  | "close"
  | "connecting"
  | "not_configured"
  | "error"
  | "unknown";

export interface EvolutionStatus {
  configured: boolean;
  connected: boolean;
  state: EvolutionConnectionState;
  instance: string;
  error?: string;
}

export interface EvolutionQRResult {
  configured: boolean;
  connected: boolean;
  qrBase64: string | null;
  pairingCode: string | null;
  error?: string;
}

function evolutionHeaders(useGlobalKey = false) {
  return {
    apikey: useGlobalKey ? EVOLUTION_GLOBAL_KEY : EVOLUTION_API_KEY,
    "Content-Type": "application/json",
  };
}

async function evolutionFetch<T>(
  path: string,
  options: RequestInit & { useGlobalKey?: boolean } = {}
): Promise<{ ok: boolean; status: number; body: T | null }> {
  const { useGlobalKey, ...fetchOptions } = options;
  const res = await fetch(`${EVOLUTION_API_URL}${path}`, {
    ...fetchOptions,
    headers: {
      ...evolutionHeaders(useGlobalKey),
      ...(fetchOptions.headers ?? {}),
    },
    cache: "no-store",
  });

  let body: T | null = null;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    body = (await res.json()) as T;
  }

  return { ok: res.ok, status: res.status, body };
}

export function isEvolutionConfigured() {
  return Boolean(EVOLUTION_API_URL && EVOLUTION_API_KEY && EVOLUTION_INSTANCE);
}

// Consulta o status de conexão da instância WhatsApp.
export async function getEvolutionStatus(): Promise<EvolutionStatus> {
  if (!isEvolutionConfigured()) {
    return {
      configured: false,
      connected: false,
      state: "not_configured",
      instance: EVOLUTION_INSTANCE,
      error: "Evolution API não configurada no .env.local",
    };
  }

  const { ok, body } = await evolutionFetch<{
    instance?: { state?: string };
    state?: string;
    response?: { message?: string[] };
    error?: string;
    message?: string;
  }>(`/instance/connectionState/${EVOLUTION_INSTANCE}`);

  if (!ok) {
    const message =
      body?.response?.message?.[0] ??
      body?.error ??
      body?.message ??
      "Falha ao consultar status";
    return {
      configured: true,
      connected: false,
      state: "error",
      instance: EVOLUTION_INSTANCE,
      error: String(message),
    };
  }

  const rawState = body?.instance?.state ?? body?.state ?? "unknown";
  const state = rawState as EvolutionConnectionState;

  return {
    configured: true,
    connected: state === "open",
    state,
    instance: EVOLUTION_INSTANCE,
  };
}

// Extrai QR Code base64 da resposta da Evolution (formatos variam entre versões).
function extractQrBase64(body: Record<string, unknown> | null): string | null {
  if (!body) return null;

  const candidates = [
    body.base64,
    (body.qrcode as { base64?: string } | undefined)?.base64,
    (body.qr as { base64?: string } | undefined)?.base64,
    body.code,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.length > 20) {
      return value.startsWith("data:image")
        ? value
        : `data:image/png;base64,${value}`;
    }
  }

  return null;
}

// Garante que a instância exista antes de conectar (cria se necessário).
async function ensureInstance() {
  const { ok, body } = await evolutionFetch<
    Array<{ name?: string; instance?: { instanceName?: string } }>
  >(`/instance/fetchInstances?instanceName=${EVOLUTION_INSTANCE}`, {
    useGlobalKey: true,
  });

  if (!ok) return;

  const exists = Array.isArray(body) && body.length > 0;
  if (exists) return;

  await evolutionFetch("/instance/create", {
    method: "POST",
    useGlobalKey: true,
    body: JSON.stringify({
      instanceName: EVOLUTION_INSTANCE,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    }),
  });
}

// Solicita QR Code ou código de pareamento para conectar o WhatsApp.
export async function getEvolutionQR(): Promise<EvolutionQRResult> {
  const status = await getEvolutionStatus();

  if (!status.configured) {
    return {
      configured: false,
      connected: false,
      qrBase64: null,
      pairingCode: null,
      error: status.error,
    };
  }

  if (status.connected) {
    return {
      configured: true,
      connected: true,
      qrBase64: null,
      pairingCode: null,
    };
  }

  await ensureInstance();

  const { ok, body } = await evolutionFetch<Record<string, unknown>>(
    `/instance/connect/${EVOLUTION_INSTANCE}`
  );

  if (!ok) {
    return {
      configured: true,
      connected: false,
      qrBase64: null,
      pairingCode: null,
      error: "Não foi possível gerar o QR Code. Verifique a instância na Evolution API.",
    };
  }

  const pairingCode =
    typeof body?.pairingCode === "string" ? body.pairingCode : null;

  return {
    configured: true,
    connected: false,
    qrBase64: extractQrBase64(body),
    pairingCode,
  };
}

// Reinicia a instância (útil após desconexão).
export async function restartEvolutionInstance(): Promise<{ ok: boolean; error?: string }> {
  if (!isEvolutionConfigured()) {
    return { ok: false, error: "Evolution API não configurada" };
  }

  const { ok, body } = await evolutionFetch<{ message?: string }>(
    `/instance/restart/${EVOLUTION_INSTANCE}`,
    { method: "POST" }
  );

  if (!ok) {
    return { ok: false, error: body?.message ?? "Falha ao reiniciar instância" };
  }

  return { ok: true };
}

// Desconecta a sessão WhatsApp da instância.
export async function logoutEvolutionInstance(): Promise<{ ok: boolean; error?: string }> {
  if (!isEvolutionConfigured()) {
    return { ok: false, error: "Evolution API não configurada" };
  }

  const { ok, body } = await evolutionFetch<{ message?: string }>(
    `/instance/logout/${EVOLUTION_INSTANCE}`,
    { method: "DELETE" }
  );

  if (!ok) {
    return { ok: false, error: body?.message ?? "Falha ao desconectar" };
  }

  return { ok: true };
}
