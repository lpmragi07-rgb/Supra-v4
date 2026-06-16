"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface AuthState {
  error?: string;
  message?: string;
}

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

// Login com e-mail e senha
export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase não configurado. Preencha o arquivo .env.local." };
  }

  const { email, password } = readCredentials(formData);
  if (!email || !password) {
    return { error: "Informe e-mail e senha." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "E-mail ou senha inválidos." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

// Cadastro de novo usuário
export async function signup(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase não configurado. Preencha o arquivo .env.local." };
  }

  const { email, password } = readCredentials(formData);
  if (!email || !password) {
    return { error: "Informe e-mail e senha." };
  }
  if (password.length < 6) {
    return { error: "A senha deve ter ao menos 6 caracteres." };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  // Quando a confirmação de e-mail está ativa, não há sessão imediata.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/");
  }

  return {
    message: "Conta criada! Verifique seu e-mail para confirmar o acesso.",
  };
}

// Logout
export async function signout() {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/login");
}
