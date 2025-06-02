#!/bin/bash

# Função para gerar UUID v4
generate_uuid() {
  # Gera 16 bytes aleatórios e formata como UUID v4
  local uuid=$(dd if=/dev/urandom bs=16 count=1 2>/dev/null | od -An -tx1 | tr -dc 'a-f0-9' | fold -w 32 | sed 's/\([0-9a-f]\{8\}\)\([0-9a-f]\{4\}\)\([0-9a-f]\{4\}\)\([0-9a-f]\{4\}\)\([0-9a-f]\{12\}\)/\1-\2-4\3-8\4-\5/')
  echo "$uuid" | tr '[:lower:]' '[:upper:]'
}

# Gerar um novo NEXTAUTH_SECRET seguro
echo "Gerando novo NEXTAUTH_SECRET..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)

echo "Gerando novo WHATSAPP_WEBHOOK_SECRET..."
WHATSAPP_WEBHOOK_SECRET=$(openssl rand -hex 16)

echo "Gerando novo WHATSAPP_API_KEY..."
WHATSAPP_API_KEY=$(generate_uuid)

echo "\n=== NOVAS CHAVES GERADAS ==="
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
echo "WHATSAPP_WEBHOOK_SECRET=$WHATSAPP_WEBHOOK_SECRET"
echo "WHATSAPP_API_KEY=$WHATSAPP_API_KEY"
echo "==========================\n"

echo "Para atualizar seu .env, execute:"
echo "-----------------------------"
echo "sed -i 's/^NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET="$NEXTAUTH_SECRET"/' .env"
echo "sed -i 's/^WHATSAPP_WEBHOOK_SECRET=.*/WHATSAPP_WEBHOOK_SECRET="$WHATSAPP_WEBHOOK_SECRET"/' .env"
echo "sed -i 's/^WHATSAPP_API_KEY=.*/WHATSAPP_API_KEY="$WHATSAPP_API_KEY"/' .env"
