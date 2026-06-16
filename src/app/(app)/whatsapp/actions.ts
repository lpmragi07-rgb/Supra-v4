"use server";

import {
  getEvolutionQR,
  getEvolutionStatus,
  logoutEvolutionInstance,
  restartEvolutionInstance,
} from "@/lib/evolution";

export async function fetchWhatsAppStatus() {
  return getEvolutionStatus();
}

export async function fetchWhatsAppQR() {
  return getEvolutionQR();
}

export async function restartWhatsApp() {
  return restartEvolutionInstance();
}

export async function logoutWhatsApp() {
  return logoutEvolutionInstance();
}
