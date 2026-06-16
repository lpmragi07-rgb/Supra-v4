# Supra V4

Plataforma premium de **prospecção B2B via WhatsApp**. Front-end em Next.js que
gerencia campanhas e leads, preparado para um **Worker externo** que cuidará dos
disparos futuramente.

## Stack

- **Next.js 14+** (App Router) + **TypeScript**
- **Tailwind CSS** (design premium e scannable)
- **lucide-react** (iconografia)
- **Framer Motion** (animações: tabela de leads em cascata/stagger)
- **Supabase** (Auth por e-mail/senha + Database + RLS)
- **Vercel Analytics** + **Speed Insights**

> O projeto roda em **modo demonstração** (dados mockados) enquanto o
> `.env.local` não estiver configurado. Ao preencher as credenciais do
> Supabase, a autenticação e a persistência reais são ativadas automaticamente.

## Estrutura

```
middleware.ts                # refresh de sessão + proteção de rotas
src/
├── app/
│   ├── layout.tsx          # Fontes (Playfair/Inter) + Vercel Analytics
│   ├── login/              # tela de login + server actions (auth)
│   └── (app)/              # área autenticada (route group)
│       ├── layout.tsx      # Navbar (com usuário/logout)
│       ├── page.tsx        # Dashboard (métricas reais)
│       ├── upload/         # Upload de lista + action de importação
│       └── campaigns/      # Gestão de campanhas + action pausar/iniciar
├── components/
│   ├── ui/                 # Navbar, Card, Button, Badge
│   ├── auth/               # LoginForm
│   ├── dashboard/          # MetricCard
│   ├── upload/             # CsvDropzone
│   └── campaigns/          # CampaignsTable (Framer Motion)
└── lib/
    ├── supabase/           # client, server, middleware, config, types
    ├── auth.ts             # getUser (sessão)
    ├── queries.ts          # consultas (dashboard + campanhas)
    ├── csv.ts              # parser de CSV
    ├── mock-data.ts        # dados de demonstração
    └── utils.ts            # helpers (cn, formatNumber)
supabase/
└── schema.sql              # tabelas + RLS + realtime + view de métricas
worker/                     # Worker externo de disparo (independente)
└── index.mjs               # consome leads pending -> sent/failed
public/
└── exemplo-leads.csv       # modelo para testar o upload
```

## Como rodar

1. **Instale as dependências:**

   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente.** Copie o exemplo e preencha:

   ```bash
   cp .env.local.example .env.local
   ```

   Pegue os valores no painel do Supabase em
   **Project Settings → API**:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
   ```

   > A chave `anon` é segura para o navegador — a proteção dos dados é feita
   > pelo **Row Level Security (RLS)**. A chave `service_role` é de uso
   > exclusivo do Worker/servidor e **nunca** deve ter o prefixo `NEXT_PUBLIC_`.

3. **Crie o banco de dados.** No Supabase, abra o **SQL Editor**, cole o
   conteúdo de [`supabase/schema.sql`](./supabase/schema.sql) e execute. Isso
   cria as tabelas `campaigns` e `leads`, a view `campaign_metrics` e as
   políticas de RLS.

4. **Habilite a autenticação por e-mail/senha.** No Supabase, vá em
   **Authentication → Providers → Email** e mantenha-o habilitado. Para testar
   rapidamente sem caixa de e-mail, você pode desativar a confirmação de
   e-mail em **Authentication → Sign In / Providers → Confirm email**.

5. **Rode o projeto:**

   ```bash
   npm run dev
   ```

   Acesse [http://localhost:3000](http://localhost:3000). Você será
   redirecionado para `/login` — crie uma conta e comece a importar leads.

## Autenticação e segurança

- Login/cadastro por **e-mail e senha** via Supabase Auth (Server Actions).
- O `middleware.ts` faz o **refresh da sessão** e **protege as rotas**
  (`/`, `/upload`, `/campaigns`); usuários não autenticados vão para `/login`.
- Todas as leituras/gravações passam pelo **RLS**: cada usuário só acessa as
  próprias campanhas e leads.

## Banco de dados (resumo)

- **`campaigns`** — `id`, `user_id`, `name`, `status`, `created_at`
- **`leads`** — `id`, `campaign_id`, `company_name`, `phone_number`, `status`
  (`pending` | `sent` | `failed`), `error_message`
- **RLS** — cada usuário autenticado só acessa as próprias campanhas e leads.

## Funcionalidades implementadas

- ✅ **Auth** por e-mail/senha + proteção de rotas via middleware.
- ✅ **Dashboard** com métricas calculadas a partir dos dados reais.
- ✅ **Upload de CSV** com drag & drop que cria a campanha e insere os leads.
- ✅ **Gestão de campanhas** com pausar/iniciar persistido e leads vinculados.
- ✅ **Framer Motion**: linhas de leads aparecem em cascata (stagger).
- ✅ **Realtime**: o status dos leads atualiza ao vivo (selo "Ao vivo").
- ✅ **Worker externo** (pasta `worker/`) que processa os leads `pending`.

## Realtime

O `supabase/schema.sql` já adiciona as tabelas à publicação
`supabase_realtime` e define `replica identity full`. A tabela de campanhas
assina mudanças na tabela `leads` (respeitando o RLS) e atualiza as contagens
e status **em tempo real** — sem reload. Verifique também que o Realtime está
habilitado no painel: **Database → Replication**.

## Worker externo (disparos)

A arquitetura é separada: o front-end gerencia os dados e um **Worker
independente** (`worker/`) cuida dos disparos. Ele usa a chave `service_role`,
lê os leads `pending` de campanhas `active`, dispara (simulado por enquanto) e
grava `sent`/`failed`. Veja [`worker/README.md`](./worker/README.md).

```bash
cd worker
cp .env.example .env   # SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
npm install
npm start
```

## Próximos passos

- Trocar a simulação por uma **API real de WhatsApp** (Cloud API, Z-API, etc.)
  na função `sendWhatsAppMessage` do worker.
- Paginação/busca na listagem de campanhas e leads.
- Dashboard em tempo real (assinar `campaigns`/`leads` também na home).
