# Evolution API + Worker — Supra V4

Stack completo para disparos via WhatsApp, rodando em Docker.

## Subir tudo (API + banco + worker)

```bash
cd evolution

# Crie .env com suas credenciais Supabase (para o worker)
cat > .env << 'EOF'
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
EOF

docker compose up -d
```

Isso sobe:
- **PostgreSQL** + **Redis** (banco da Evolution)
- **Evolution API** na porta `8080`
- **Worker** de disparo (processa campanhas ativas automaticamente)

## Usar pelo site (fluxo completo)

1. Configure `EVOLUTION_API_URL` e `EVOLUTION_API_KEY` no `.env.local` do app
2. Acesse **Campanhas** → clique **Iniciar**
3. Se o WhatsApp não estiver conectado, aparece o **QR Code** no modal
4. Escaneie com o celular → campanha inicia automaticamente
5. O **worker** no Docker envia as mensagens

## Produção na Vercel (supra-v4.vercel.app)

A Vercel **não acessa** `localhost` do seu Mac. Para tudo funcionar pelo site em produção:

### Opção A — Easypanel / VPS (recomendado)

1. Suba este `docker-compose.yml` em um servidor público (Easypanel, Railway, VPS)
2. Anote a URL pública (ex: `https://evo.seudominio.com`)
3. Na Vercel → Settings → Environment Variables:

```
EVOLUTION_API_URL=https://evo.seudominio.com
EVOLUTION_API_KEY=sua-chave-secreta
EVOLUTION_INSTANCE=supra-v4
```

4. Atualize `SERVER_URL` no docker-compose para a URL pública
5. Redeploy na Vercel

### Opção B — ngrok (teste rápido)

```bash
ngrok http 8080
```

Use a URL gerada (ex: `https://abc123.ngrok.io`) como `EVOLUTION_API_URL` na Vercel.

## Comandos úteis

```bash
docker compose ps          # status
docker compose logs -f     # logs de tudo
docker compose logs -f worker   # só o worker
docker compose down        # parar
```
