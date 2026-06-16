"use server";

import { getUser } from "@/lib/auth";
import {
  getEvolutionQR,
  getEvolutionStatus,
  logoutEvolutionInstance,
  restartEvolutionInstance,
} from "@/lib/evolution";
import { getOrCreateUserInstance } from "@/lib/whatsapp-connection";

async function requireUserInstance() {
  const user = await getUser();
  if (!user) {
    return { error: "Faça login para conectar o WhatsApp." as const };
  }
  const instanceName = await getOrCreateUserInstance(user.id);
  return { user, instanceName };
}

export async function fetchWhatsAppStatus() {
  const ctx = await requireUserInstance();
  if ("error" in ctx) {
    return {
      configured: false,
      connected: false,
      state: "not_configured" as const,
      instance: "",
      error: ctx.error,
    };
  }
  return getEvolutionStatus(ctx.instanceName);
}

export async function fetchWhatsAppQR() {
  const ctx = await requireUserInstance();
  if ("error" in ctx) {
    return {
      configured: false,
      connected: false,
      qrBase64: null,
      pairingCode: null,
      error: ctx.error,
    };
  }
  return getEvolutionQR(ctx.instanceName);
}

export async function restartWhatsApp() {
  const ctx = await requireUserInstance();
  if ("error" in ctx) return { ok: false, error: ctx.error };
  return restartEvolutionInstance(ctx.instanceName);
}

export async function logoutWhatsApp() {
  const ctx = await requireUserInstance();
  if ("error" in ctx) return { ok: false, error: ctx.error };
  return logoutEvolutionInstance(ctx.instanceName);
}
