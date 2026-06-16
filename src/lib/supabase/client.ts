"use client";

import { createBrowserClient } from "@supabase/ssr";

// Cliente Supabase para uso no navegador (Client Components).
// Usa a chave pública "anon" — toda a segurança é garantida via RLS.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
