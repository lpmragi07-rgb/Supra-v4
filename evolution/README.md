# Evolution API + Worker — Supra V4

Stack para disparos via WhatsApp. Suporta **vários operadores** — cada um com instância própria na Evolution API.

## Subir tudo (API + banco + worker)

```bash
cd evolution

# Crie .env com credenciais Supabase + URL pública (produção)
cat > .env << 'EOF'
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
EVOLUTION_API_KEY=sua-chave-secreta-forte
SERVER_URL=https://evo.seudominio.com
EOF

docker compose up -d
```

Isso sobe:
- **PostgreSQL** + **Redis** (banco da Evolution)
- **Evolution API** na porta `8080`
- **Worker** multi-operador (processa campanhas ativas)

## Fluxo do operador (produção)

1. Login em https://supra-v4.vercel.app
2. **Upload de Lista** → importar CSV
3. **Campanhas** → **Iniciar** → escanear QR Code
4. Worker envia mensagens automaticamente

## Produção na Vercel

A Vercel **não acessa** `localhost`. Veja o guia completo em **`DEPLOY.md`**.

Resumo:
1. Suba este `docker-compose.yml` em servidor público (Easypanel, Railway, VPS)
2. Configure `SERVER_URL` e `EVOLUTION_API_KEY` no `.env`
3. Na Vercel, defina `EVOLUTION_API_URL` = URL pública da Evolution
4. **Não** use `EVOLUTION_INSTANCE` — cada operador tem instância automática

## Comandos úteis

```bash
docker compose ps          # status
docker compose logs -f     # logs de tudo
docker compose logs -f worker   # só o worker
docker compose down        # parar
```
