# Worker de Disparo — Supra V4

Worker **externo e independente** do front-end. Consome os leads com status
`pending` das campanhas **ativas**, envia mensagens via **Evolution API** e
atualiza o status para `sent` ou `failed`. O front-end reflete cada mudança em
tempo real (Supabase Realtime).

## Pré-requisitos

1. **Evolution API** rodando (Docker, Easypanel, Railway, VPS, etc.)
2. WhatsApp **conectado** via QR Code em `/whatsapp` no app
3. Variáveis preenchidas no `.env` do worker

## Como rodar

```bash
cd worker
cp .env.example .env     # preencha Supabase + Evolution API
npm install
npm start
```

## Variáveis de ambiente

| Variável | Obrigatório | Descrição |
| --- | --- | --- |
| `SUPABASE_URL` | Sim | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Chave service_role (segredo!) |
| `EVOLUTION_API_URL` | Sim | URL base da Evolution API |
| `EVOLUTION_API_KEY` | Sim | API Key da instância |
| `EVOLUTION_INSTANCE` | Sim | Nome da instância (ex: `supra-v4`) |
| `WHATSAPP_MESSAGE_TEMPLATE` | Não | Template com `{{empresa}}` e `{{telefone}}` |
| `BATCH_SIZE` | Não | Leads por ciclo (padrão: 5) |
| `POLL_INTERVAL_MS` | Não | Intervalo entre ciclos (padrão: 5000) |
| `SEND_DELAY_MS` | Não | Delay entre mensagens (padrão: 1200) |

## Como funciona

1. Verifica se o WhatsApp está conectado (`connectionState === open`).
2. Busca campanhas com `status = 'active'`.
3. Para cada campanha, pega um lote (`BATCH_SIZE`) de leads `pending`.
4. Envia via `POST /message/sendText/{instance}` na Evolution API.
5. Grava `sent`/`failed` (+ `error_message`) no Supabase.
6. Quando não há mais pendentes, marca a campanha como `completed`.

## Fluxo completo

1. Configure a Evolution API e preencha `.env.local` no app + `.env` no worker.
2. Acesse **WhatsApp** no app e escaneie o QR Code.
3. Importe leads em **Upload de Lista**.
4. Em **Campanhas**, clique em **Iniciar** (rascunho → ativa).
5. Rode o worker (`npm start`).
6. Acompanhe os leads mudando de `pending` → `sent` em tempo real.

## Dicas anti-ban

- Use `BATCH_SIZE=3` a `5` e `SEND_DELAY_MS=1200` ou mais.
- Evite disparos em massa para números frios sem opt-in.
- Monitore falhas na tabela de leads.
