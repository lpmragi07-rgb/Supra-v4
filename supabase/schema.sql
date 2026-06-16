-- =============================================================================
-- Zuckerberg Prospect — Schema do Banco de Dados (Supabase / PostgreSQL)
-- =============================================================================
-- Execute este arquivo no SQL Editor do Supabase
-- (Dashboard > SQL Editor > New query > cole tudo > Run).
--
-- Cria as tabelas `campaigns` e `leads` com Row Level Security (RLS) garantindo
-- que cada usuário autenticado só acesse os próprios dados.
-- =============================================================================

-- Extensão para geração de UUIDs (geralmente já habilitada no Supabase)
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- ENUMs (tipos controlados de status)
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'campaign_status') then
    create type public.campaign_status as enum ('draft', 'active', 'paused', 'completed');
  end if;

  if not exists (select 1 from pg_type where typname = 'lead_status') then
    create type public.lead_status as enum ('pending', 'sent', 'failed');
  end if;
end$$;

-- -----------------------------------------------------------------------------
-- Tabela: campaigns
-- -----------------------------------------------------------------------------
create table if not exists public.campaigns (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 120),
  status      public.campaign_status not null default 'draft',
  created_at  timestamptz not null default now()
);

create index if not exists campaigns_user_id_idx on public.campaigns (user_id);
create index if not exists campaigns_created_at_idx on public.campaigns (created_at desc);

-- -----------------------------------------------------------------------------
-- Tabela: leads
-- -----------------------------------------------------------------------------
create table if not exists public.leads (
  id             uuid primary key default gen_random_uuid(),
  campaign_id    uuid not null references public.campaigns (id) on delete cascade,
  company_name   text not null check (char_length(company_name) between 1 and 200),
  phone_number   text not null,
  status         public.lead_status not null default 'pending',
  error_message  text,
  created_at     timestamptz not null default now()
);

create index if not exists leads_campaign_id_idx on public.leads (campaign_id);
create index if not exists leads_status_idx on public.leads (status);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
alter table public.campaigns enable row level security;
alter table public.leads enable row level security;

-- -----------------------------------------------------------------------------
-- Políticas: campaigns (acesso restrito ao dono via auth.uid())
-- -----------------------------------------------------------------------------
drop policy if exists "campaigns_select_own" on public.campaigns;
create policy "campaigns_select_own"
  on public.campaigns for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "campaigns_insert_own" on public.campaigns;
create policy "campaigns_insert_own"
  on public.campaigns for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "campaigns_update_own" on public.campaigns;
create policy "campaigns_update_own"
  on public.campaigns for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "campaigns_delete_own" on public.campaigns;
create policy "campaigns_delete_own"
  on public.campaigns for delete
  to authenticated
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Políticas: leads
-- O acesso é validado pela campanha pai: o lead pertence ao usuário se a
-- campanha vinculada também pertencer (subconsulta em campaigns).
-- -----------------------------------------------------------------------------
drop policy if exists "leads_select_own" on public.leads;
create policy "leads_select_own"
  on public.leads for select
  to authenticated
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = leads.campaign_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "leads_insert_own" on public.leads;
create policy "leads_insert_own"
  on public.leads for insert
  to authenticated
  with check (
    exists (
      select 1 from public.campaigns c
      where c.id = leads.campaign_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "leads_update_own" on public.leads;
create policy "leads_update_own"
  on public.leads for update
  to authenticated
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = leads.campaign_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.campaigns c
      where c.id = leads.campaign_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "leads_delete_own" on public.leads;
create policy "leads_delete_own"
  on public.leads for delete
  to authenticated
  using (
    exists (
      select 1 from public.campaigns c
      where c.id = leads.campaign_id
        and c.user_id = auth.uid()
    )
  );

-- =============================================================================
-- REALTIME
-- Habilita a publicação de mudanças em tempo real nas tabelas.
-- O Realtime respeita o RLS, então o navegador só recebe eventos dos
-- próprios registros do usuário autenticado.
-- =============================================================================
do $$
begin
  -- Adiciona as tabelas à publicação do Realtime (ignora se já estiverem)
  begin
    alter publication supabase_realtime add table public.leads;
  exception
    when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.campaigns;
  exception
    when duplicate_object then null;
  end;
end$$;

-- Garante captura completa do registro antigo em UPDATE/DELETE (payload.old)
alter table public.leads replica identity full;
alter table public.campaigns replica identity full;

-- =============================================================================
-- VIEW de métricas agregadas (útil para o Dashboard)
-- Respeita o RLS das tabelas base por usar security_invoker.
-- =============================================================================
create or replace view public.campaign_metrics
with (security_invoker = true) as
select
  c.id                                                as campaign_id,
  c.user_id                                           as user_id,
  c.name                                              as campaign_name,
  c.status                                            as campaign_status,
  count(l.id)                                         as total_leads,
  count(l.id) filter (where l.status = 'sent')        as sent_count,
  count(l.id) filter (where l.status = 'failed')      as failed_count,
  count(l.id) filter (where l.status = 'pending')     as pending_count
from public.campaigns c
left join public.leads l on l.campaign_id = c.id
group by c.id, c.user_id, c.name, c.status;
