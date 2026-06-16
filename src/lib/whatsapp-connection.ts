// Conexão WhatsApp por operador — cada usuário tem sua instância na Evolution API.

import { createClient } from "@/lib/supabase/server";

// Gera nome único e válido para a Evolution API a partir do user_id.
export function buildInstanceName(userId: string): string {
  return `u${userId.replace(/-/g, "").slice(0, 24)}`;
}

// Retorna a instância do operador ou cria um registro novo no Supabase.
export async function getOrCreateUserInstance(userId: string): Promise<string> {
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("whatsapp_connections")
    .select("instance_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.instance_name) {
    return existing.instance_name;
  }

  const instanceName = buildInstanceName(userId);

  const { error } = await supabase.from("whatsapp_connections").insert({
    user_id: userId,
    instance_name: instanceName,
  });

  // Corrida: outro request criou ao mesmo tempo
  if (error) {
    const { data: retry } = await supabase
      .from("whatsapp_connections")
      .select("instance_name")
      .eq("user_id", userId)
      .maybeSingle();
    if (retry?.instance_name) return retry.instance_name;
    throw new Error(error.message);
  }

  return instanceName;
}
