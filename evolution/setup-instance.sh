#!/bin/bash
# Cria a instância WhatsApp na Evolution API local (rode uma vez)
set -euo pipefail

API_URL="${EVOLUTION_API_URL:-http://localhost:8080}"
API_KEY="${EVOLUTION_API_KEY:-sua-chave-secreta}"
INSTANCE="${EVOLUTION_INSTANCE:-supra-v4}"

echo "Criando instância '$INSTANCE' em $API_URL ..."

curl -s -X POST "$API_URL/instance/create" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"instanceName\":\"$INSTANCE\",\"qrcode\":true,\"integration\":\"WHATSAPP-BAILEYS\"}" \
  | python3 -m json.tool 2>/dev/null || echo "Instância criada (ou já existia)."

echo ""
echo "Pronto! Agora clique Iniciar no site para ver o QR Code."
