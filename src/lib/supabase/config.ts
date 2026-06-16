// Indica se as variáveis do Supabase estão configuradas.
// Permite que o front-end rode (em modo demonstração) antes do setup do backend.
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
