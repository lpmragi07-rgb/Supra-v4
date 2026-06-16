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

type ApiErrorBody = {
  response?: { message?: string[] };
  error?: string;
  message?: string;
};

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

  try {
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
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha de rede";
    return {
      ok: false,
      status: 0,
      body: { error: `Evolution API inacessível (${message}). Verifique se o Docker está rodando.` } as T,
    };
  }
}

function extractApiError(body: ApiErrorBody | null): string {
  if (!body) return "Erro desconhecido na Evolution API";
  const msg = body.response?.message?.[0] ?? body.error ?? body.message;
  return String(msg ?? "Erro desconhecido na Evolution API");
}

function instanceExistsInList(body: unknown): boolean {
  if (!Array.isArray(body)) return false;
  return body.some((item) => {
    if (!item || typeof item !== "object") return false;
    const row = item as Record<string, unknown>;
    const nested = row.instance as Record<string, unknown> | undefined;
    return (
      row.name === EVOLUTION_INSTANCE ||
      row.instanceName === EVOLUTION_INSTANCE ||
      nested?.instanceName === EVOLUTION_INSTANCE
    );
  });
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

  const { ok, status, body } = await evolutionFetch<{
    instance?: { state?: string };
    state?: string;
  } & ApiErrorBody>(`/instance/connectionState/${EVOLUTION_INSTANCE}`);

  // Instância ainda não criada — normal antes do primeiro QR Code
  if (!ok && status === 404) {
    return {
      configured: true,
      connected: false,
      state: "close",
      instance: EVOLUTION_INSTANCE,
    };
  }

  if (!ok) {
    return {
      configured: true,
      connected: false,
      state: "error",
      instance: EVOLUTION_INSTANCE,
      error: extractApiError(body),
    };
  }

  const rawState = body?.instance?.state ?? body?.state ?? "close";
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

  const qrcode = body.qrcode as Record<string, unknown> | undefined;
  const qr = body.qr as Record<string, unknown> | undefined;

  const candidates = [
    body.base64,
    qrcode?.base64,
    qrcode?.code,
    qr?.base64,
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

// Cria a instância WhatsApp na Evolution API (se ainda não existir).
async function createInstance(): Promise<{
  ok: boolean;
  error?: string;
  body?: Record<string, unknown> | null;
}> {
  const { ok, status, body } = await evolutionFetch<Record<string, unknown>>(
    "/instance/create",
    {
      method: "POST",
      useGlobalKey: true,
      body: JSON.stringify({
        instanceName: EVOLUTION_INSTANCE,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
    }
  );

  // Já existe — segue para o connect
  if (!ok && (status === 403 || status === 409)) {
    return { ok: true, body };
  }

  if (!ok) {
    return { ok: false, error: extractApiError(body), body };
  }

  return { ok: true, body };
}

// Garante que a instância exista antes de conectar.
async function ensureInstance(): Promise<{ ok: boolean; error?: string }> {
  const { ok, body } = await evolutionFetch<unknown>("/instance/fetchInstances", {
    useGlobalKey: true,
  });

  if (ok && instanceExistsInList(body)) {
    return { ok: true };
  }

  const created = await createInstance();
  if (!created.ok) {
    return { ok: false, error: created.error };
  }

  return { ok: true };
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

  const ensured = await ensureInstance();
  if (!ensured.ok) {
    return {
      configured: true,
      connected: false,
      qrBase64: null,
      pairingCode: null,
      error: ensured.error ?? "Falha ao criar instância na Evolution API.",
    };
  }

  const { ok, body } = await evolutionFetch<Record<string, unknown>>(
    `/instance/connect/${EVOLUTION_INSTANCE}`
  );

  if (!ok) {
    return {
      configured: true,
      connected: false,
      qrBase64: null,
      pairingCode: null,
      error: extractApiError(body),
    };
  }

  const pairingCode =
    typeof body?.pairingCode === "string" ? body.pairingCode : null;
  const qrBase64 = extractQrBase64(body);

  if (!qrBase64) {
    return {
      configured: true,
      connected: false,
      qrBase64: null,
      pairingCode,
      error:
        "Instância criada, mas o QR Code não veio na resposta. Clique em Tentar novamente.",
    };
  }

  return {
    configured: true,
    connected: false,
    qrBase64,
    pairingCode,
  };
}

// Reinicia a instância (útil após desconexão).
export async function restartEvolutionInstance(): Promise<{ ok: boolean; error?: string }> {
  if (!isEvolutionConfigured()) {
    return { ok: false, error: "Evolution API não configurada" };
  }

  await ensureInstance();

  const { ok, body } = await evolutionFetch<{ message?: string } & ApiErrorBody>(
    `/instance/restart/${EVOLUTION_INSTANCE}`,
    { method: "POST" }
  );

  if (!ok) {
    return { ok: false, error: extractApiError(body) };
  }

  return { ok: true };
}

// Desconecta a sessão WhatsApp da instância.
export async function logoutEvolutionInstance(): Promise<{ ok: boolean; error?: string }> {
  if (!isEvolutionConfigured()) {
    return { ok: false, error: "Evolution API não configurada" };
  }

  const { ok, body } = await evolutionFetch<{ message?: string } & ApiErrorBody>(
    `/instance/logout/${EVOLUTION_INSTANCE}`,
    { method: "DELETE" }
  );

  if (!ok) {
    return { ok: false, error: extractApiError(body) };
  }

  return { ok: true };
}
