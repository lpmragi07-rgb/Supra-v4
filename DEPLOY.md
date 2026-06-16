# Deploy em Produção — Supra V4

Guia para operadores usarem o app em **https://supra-v4.vercel.app** com WhatsApp real.

## Arquitetura

```
Operadores → Vercel (Next.js)
                ↓
         Supabase (auth, campanhas, leads, whatsapp_connections)
                ↓
    Evolution API + Worker (servidor 24/7, URL pública)
                ↓
         WhatsApp de cada operador (instância própria)
```

A **Vercel** hospeda só o front-end. A **Evolution API** e o **worker** precisam
rodar em um servidor sempre ligado (Railway, Easypanel, VPS, etc.).

---

## Passo 1 — Banco de dados (Supabase)

Se o banco já existe, execute a migração no **SQL Editor**:

```sql
-- Cole o conteúdo de: supabase/migrations/001_whatsapp_connections.sql
```

Ou rode o `supabase/schema.sql` completo em um projeto novo.

---

## Passo 2 — Evolution API + Worker na nuvem

### Opção A — Easypanel / VPS (recomendado)

1. Clone o repositório no servidor
2. Crie `evolution/.env`:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
EVOLUTION_API_KEY=sua-chave-secreta-forte
SERVER_URL=https://evo.seudominio.com
```

3. Ajuste `AUTHENTICATION_API_KEY` no compose para a mesma chave (`EVOLUTION_API_KEY`)
4. Suba os containers:

```bash
cd evolution
docker compose up -d
```

5. Configure DNS/reverse proxy apontando `https://evo.seudominio.com` → porta `8080`
6. Teste: `curl -H "apikey: sua-chave" https://evo.seudominio.com/instance/fetchInstances`

### Opção B — Railway

1. Novo projeto → **Deploy from GitHub**
2. Root directory: `evolution`
3. Use o `docker-compose.yml` ou deploy só da imagem `evoapicloud/evolution-api:v2.3.7`
4. Adicione Postgres + Redis (plugins Railway) ou use o compose completo
5. Variáveis: `SERVER_URL`, `AUTHENTICATION_API_KEY`, `DATABASE_*`, `CACHE_REDIS_*`
6. Worker: serviço separado com root `worker`, comando `node index.mjs`

---

## Passo 3 — Variáveis na Vercel

Em **Settings → Environment Variables** do projeto `supra-v4`:

| Variável | Valor |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon |
| `EVOLUTION_API_URL` | `https://evo.seudominio.com` (URL pública!) |
| `EVOLUTION_API_KEY` | Mesma chave do `AUTHENTICATION_API_KEY` |

**Não** configure `EVOLUTION_INSTANCE` — cada operador ganha instância automática.

Redeploy após salvar as variáveis.

---

## Passo 4 — Criar usuários operadores

No Supabase → **Authentication → Users** → convide ou crie contas para cada operador.

Cada operador:
1. Faz login no app
2. Importa CSV
3. Clica **Iniciar** na campanha
4. Escaneia o QR Code (WhatsApp pessoal/empresarial dele)
5. Acompanha disparos em tempo real

---

## Checklist rápido

- [ ] Migração `whatsapp_connections` aplicada no Supabase
- [ ] Evolution API acessível pela internet (não localhost)
- [ ] Worker rodando e conectado ao Supabase
- [ ] `EVOLUTION_API_URL` na Vercel aponta para URL pública
- [ ] Redeploy da Vercel feito
- [ ] Teste: operador conecta QR e campanha envia mensagens

---

## Desenvolvimento local

Para testar no Mac sem Vercel:

```bash
# Terminal 1 — Evolution + worker
cd evolution && docker compose up -d

# Terminal 2 — App
cp .env.local.example .env.local   # EVOLUTION_API_URL=http://localhost:8080
npm run dev
```

Localmente cada operador também usa instância própria (via login Supabase).

---

## Problemas comuns

| Sintoma | Causa | Solução |
| --- | --- | --- |
| QR não aparece na Vercel | `EVOLUTION_API_URL` aponta para localhost | Use URL pública da Evolution |
| Campanha não envia | Worker parado ou WhatsApp desconectado | `docker compose logs -f worker` |
| "Operador sem instância" | Operador não escaneou QR | Iniciar campanha → modal QR |
| QR `count: 0` | Imagem Evolution antiga | Use `evoapicloud/evolution-api:v2.3.7` |
