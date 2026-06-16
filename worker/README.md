# Worker de Disparo — Zuckerberg Prospect

Worker **externo e independente** do front-end. Consome os leads com status
`pending` das campanhas **ativas**, "dispara" a mensagem e atualiza o status
para `sent` ou `failed`. O front-end reflete cada mudança em tempo real
(Supabase Realtime).

> O envio de WhatsApp está **simulado** na função `sendWhatsAppMessage`
> (`index.mjs`). Substitua-a pela integração real (WhatsApp Cloud API, Z-API,
> Evolution API, etc.).

## Como rodar

```bash
cd worker
cp .env.example .env     # preencha SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
npm install
npm start
```

## Como funciona

1. A cada ciclo, busca campanhas com `status = 'active'`.
2. Para cada campanha, pega um lote (`BATCH_SIZE`) de leads `pending`.
3. Dispara cada um e grava `sent`/`failed` (+ `error_message`).
4. Quando não há mais pendentes, marca a campanha como `completed`.
5. Aguarda `POLL_INTERVAL_MS` e repete (Ctrl+C encerra com segurança).

## Variáveis de ambiente

| Variável                    | Padrão | Descrição                                  |
| --------------------------- | ------ | ------------------------------------------ |
| `SUPABASE_URL`              | —      | URL do projeto Supabase                    |
| `SUPABASE_SERVICE_ROLE_KEY` | —      | Chave service_role (ignora RLS — segredo!) |
| `BATCH_SIZE`                | `10`   | Leads processados por ciclo                |
| `POLL_INTERVAL_MS`          | `5000` | Intervalo entre ciclos (ms)                |
| `SEND_DELAY_MS`             | `800`  | Latência simulada por disparo (ms)         |
| `FAILURE_RATE`              | `0.1`  | Taxa de falha simulada (0–1)               |

## Fluxo de teste ponta a ponta

1. No app, faça login e **importe** uma lista de leads (cria a campanha).
2. Na página **Campanhas**, clique em **Iniciar** (status → `active`).
3. Rode o worker (`npm start`).
4. Abra **Campanhas** e expanda a campanha: os leads mudam de `pending` para
   `sent`/`failed` **ao vivo**, com o selo "Ao vivo" no cabeçalho.
