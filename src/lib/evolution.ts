// Cliente Evolution API — multi-tenant (uma instância por operador).

const EVOLUTION_API_URL = (process.env.EVOLUTION_API_URL ?? "").replace(/\/$/, "");
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY ?? "";
const EVOLUTION_GLOBAL_KEY = process.env.EVOLUTION_GLOBAL_KEY ?? EVOLUTION_API_KEY;

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
      body: {
        error: `Evolution API inacessível (${message}).`,
      } as T,
    };
  }
}

function extractApiError(body: ApiErrorBody | null): string {
  if (!body) return "Erro desconhecido na Evolution API";
  const msg = body.response?.message?.[0] ?? body.error ?? body.message;
  return String(msg ?? "Erro desconhecido na Evolution API");
}

function instanceExistsInList(body: unknown, instanceName: string): boolean {
  if (!Array.isArray(body)) return false;
  return body.some((item) => {
    if (!item || typeof item !== "object") return false;
    const row = item as Record<string, unknown>;
    const nested = row.instance as Record<string, unknown> | undefined;
    return (
      row.name === instanceName ||
      row.instanceName === instanceName ||
      nested?.instanceName === instanceName
    );
  });
}

export function isEvolutionConfigured() {
  return Boolean(EVOLUTION_API_URL && EVOLUTION_API_KEY);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
      if (value === "0" || /^\d+$/.test(value)) continue;
      return value.startsWith("data:image")
        ? value
        : `data:image/png;base64,${value}`;
    }
  }

  return null;
}

function extractPairingCode(body: Record<string, unknown> | null): string | null {
  if (!body) return null;
  const qrcode = body.qrcode as Record<string, unknown> | undefined;
  const code = body.pairingCode ?? qrcode?.pairingCode;
  return typeof code === "string" ? code : null;
}

export async function getEvolutionStatus(
  instanceName: string
): Promise<EvolutionStatus> {
  if (!isEvolutionConfigured()) {
    return {
      configured: false,
      connected: false,
      state: "not_configured",
      instance: instanceName,
      error: "Evolution API não configurada (EVOLUTION_API_URL / EVOLUTION_API_KEY)",
    };
  }

  const { ok, status, body } = await evolutionFetch<{
    instance?: { state?: string };
    state?: string;
  } & ApiErrorBody>(`/instance/connectionState/${instanceName}`);

  if (!ok && status === 404) {
    return {
      configured: true,
      connected: false,
      state: "close",
      instance: instanceName,
    };
  }

  if (!ok) {
    return {
      configured: true,
      connected: false,
      state: "error",
      instance: instanceName,
      error: extractApiError(body),
    };
  }

  const rawState = body?.instance?.state ?? body?.state ?? "close";
  const state = rawState as EvolutionConnectionState;

  return {
    configured: true,
    connected: state === "open",
    state,
    instance: instanceName,
  };
}

async function resetStuckInstance(instanceName: string) {
  await evolutionFetch(`/instance/logout/${instanceName}`, { method: "DELETE" });
  await sleep(500);
  await evolutionFetch(`/instance/restart/${instanceName}`, { method: "POST" });
  await sleep(1500);
}

async function fetchQrWithRetry(instanceName: string) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const { ok, body } = await evolutionFetch<Record<string, unknown>>(
      `/instance/connect/${instanceName}`
    );

    if (ok && body) {
      const qrBase64 = extractQrBase64(body);
      if (qrBase64) {
        return { qrBase64, pairingCode: extractPairingCode(body) };
      }
    }

    if (attempt === 2) {
      await resetStuckInstance(instanceName);
    }

    await sleep(2000);
  }

  return { qrBase64: null, pairingCode: null };
}

async function createInstance(instanceName: string) {
  const { ok, status, body } = await evolutionFetch<Record<string, unknown>>(
    "/instance/create",
    {
      method: "POST",
      useGlobalKey: true,
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
    }
  );

  if (!ok && (status === 403 || status === 409)) {
    return { ok: true, body };
  }

  if (!ok) {
    return { ok: false, error: extractApiError(body), body };
  }

  return { ok: true, body };
}

async function ensureInstance(instanceName: string) {
  const { ok, body } = await evolutionFetch<unknown>("/instance/fetchInstances", {
    useGlobalKey: true,
  });

  if (ok && instanceExistsInList(body, instanceName)) {
    return { ok: true as const };
  }

  const created = await createInstance(instanceName);
  if (!created.ok) {
    return { ok: false as const, error: created.error };
  }

  return {
    ok: true as const,
    qrBase64: extractQrBase64(created.body ?? null),
  };
}

export async function getEvolutionQR(
  instanceName: string
): Promise<EvolutionQRResult> {
  const status = await getEvolutionStatus(instanceName);

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

  const ensured = await ensureInstance(instanceName);
  if (!ensured.ok) {
    return {
      configured: true,
      connected: false,
      qrBase64: null,
      pairingCode: null,
      error: ensured.error ?? "Falha ao criar instância na Evolution API.",
    };
  }

  if (ensured.qrBase64) {
    return {
      configured: true,
      connected: false,
      qrBase64: ensured.qrBase64,
      pairingCode: null,
    };
  }

  const { qrBase64, pairingCode } = await fetchQrWithRetry(instanceName);

  if (!qrBase64) {
    return {
      configured: true,
      connected: false,
      qrBase64: null,
      pairingCode,
      error: "QR Code não gerado. Tente novamente em alguns segundos.",
    };
  }

  return { configured: true, connected: false, qrBase64, pairingCode };
}

export async function restartEvolutionInstance(
  instanceName: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isEvolutionConfigured()) {
    return { ok: false, error: "Evolution API não configurada" };
  }

  await ensureInstance(instanceName);

  const { ok, body } = await evolutionFetch<ApiErrorBody>(
    `/instance/restart/${instanceName}`,
    { method: "POST" }
  );

  if (!ok) return { ok: false, error: extractApiError(body) };
  return { ok: true };
}

export async function logoutEvolutionInstance(
  instanceName: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isEvolutionConfigured()) {
    return { ok: false, error: "Evolution API não configurada" };
  }

  const { ok, body } = await evolutionFetch<ApiErrorBody>(
    `/instance/logout/${instanceName}`,
    { method: "DELETE" }
  );

  if (!ok) return { ok: false, error: extractApiError(body) };
  return { ok: true };
}
