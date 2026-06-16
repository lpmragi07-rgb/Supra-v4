-- =============================================================================
-- Migração: conexões WhatsApp por operador (multi-tenant)
-- Execute no SQL Editor do Supabase se o banco já existir.
-- =============================================================================

create table if not exists public.whatsapp_connections (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  instance_name  text not null unique,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists whatsapp_connections_instance_idx
  on public.whatsapp_connections (instance_name);

alter table public.whatsapp_connections enable row level security;

drop policy if exists "whatsapp_select_own" on public.whatsapp_connections;
create policy "whatsapp_select_own"
  on public.whatsapp_connections for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "whatsapp_insert_own" on public.whatsapp_connections;
create policy "whatsapp_insert_own"
  on public.whatsapp_connections for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "whatsapp_update_own" on public.whatsapp_connections;
create policy "whatsapp_update_own"
  on public.whatsapp_connections for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Worker usa service_role (ignora RLS) para ler conexões de todos os operadores.
