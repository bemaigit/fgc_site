#!/bin/bash
# Script de verificação pré-build
# Criado em: 02/06/2025

echo "=== VERIFICAÇÃO PRÉ-BUILD DO SISTEMA FGC ==="
echo "Realizando verificações essenciais antes do build..."

# Verificar se os arquivos essenciais existem
ESSENTIAL_FILES=(".env.production" "next.config.js" "package.json" "prisma/schema.prisma")
for file in "${ESSENTIAL_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ ERRO: Arquivo $file não encontrado!"
    exit 1
  else
    echo "✅ Arquivo $file encontrado."
  fi
done

# Verificar dependências
echo "Verificando dependências..."
npm ls --depth=0 2>/dev/null || true

# Verificar warnings do npm
echo "Verificando problemas nas dependências..."
npm audit || true

# Verificar se as variáveis de ambiente necessárias estão definidas
echo "Verificando variáveis de ambiente essenciais..."
ENV_VARS=("DATABASE_URL" "NEXTAUTH_URL" "NEXT_PUBLIC_BASE_URL" "NEXTAUTH_SECRET" "MINIO_ENDPOINT")
ENV_FILE=".env.production"

for var in "${ENV_VARS[@]}"; do
  if ! grep -q "^$var=" "$ENV_FILE"; then
    echo "❌ AVISO: Variável $var não encontrada em $ENV_FILE"
  else
    echo "✅ Variável $var configurada."
  fi
done

# Verificar se o schema Prisma está atualizado
echo "Verificando schema Prisma..."
npx prisma validate

echo "===== VERIFICAÇÃO CONCLUÍDA ====="
echo "Se não houver erros acima, você pode prosseguir com o build."
