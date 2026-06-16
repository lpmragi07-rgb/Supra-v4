# Worker de Disparo — Supra V4

Worker **externo e independente** do front-end. Consome os leads com status
`pending` das campanhas **ativas**, envia mensagens via **Evolution API** e
atualiza o status para `sent` ou `failed`. Suporta **vários operadores** — cada
um com sua instância WhatsApp na Evolution API.

## Pré-requisitos

1. **Evolution API** rodando 24/7 na nuvem (ver `DEPLOY.md`)
2. Tabela `whatsapp_connections` criada no Supabase
3. Cada operador conectou o WhatsApp em `/whatsapp` no app

## Como rodar

```bash
cd worker
cp .env.example .env     # preencha Supabase + Evolution API
npm install
npm start
```

Ou via Docker Compose em `evolution/` (worker sobe junto com a API).

## Variáveis de ambiente

| Variável | Obrigatório | Descrição |
| --- | --- | --- |
| `SUPABASE_URL` | Sim | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Chave service_role (segredo!) |
| `EVOLUTION_API_URL` | Sim | URL base da Evolution API |
| `EVOLUTION_API_KEY` | Sim | API Key da Evolution |
| `WHATSAPP_MESSAGE_TEMPLATE` | Não | Template com `{{empresa}}` e `{{telefone}}` |
| `BATCH_SIZE` | Não | Leads por ciclo (padrão: 5) |
| `POLL_INTERVAL_MS` | Não | Intervalo entre ciclos (padrão: 5000) |
| `SEND_DELAY_MS` | Não | Delay entre mensagens (padrão: 1200) |

## Como funciona (multi-operador)

1. Busca campanhas com `status = 'active'`.
2. Para cada campanha, resolve a instância WhatsApp do operador (`whatsapp_connections`).
3. Verifica se o WhatsApp está conectado (`connectionState === open`).
4. Processa um lote de leads `pending` e envia via Evolution API.
5. Grava `sent`/`failed` no Supabase (Realtime atualiza o front-end).
6. Quando não há mais pendentes, marca a campanha como `completed`.

## Fluxo do operador

1. Login em https://supra-v4.vercel.app
2. Upload CSV → campanha criada
3. **Iniciar** → escanear QR Code com o WhatsApp do operador
4. Worker na nuvem envia automaticamente
