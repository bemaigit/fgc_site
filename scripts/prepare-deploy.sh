#!/bin/bash
# Script de preparação para deploy na VPS
# Criado em: 02/06/2025

echo "=== PREPARAÇÃO PARA DEPLOY DO SISTEMA FGC ==="
echo "Gerando arquivos para deploy em produção..."

# Definir variáveis
IMAGE_NAME="fgc-app"
IMAGE_TAG="production"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BACKUP_DIR="./backups/pre-deploy-$TIMESTAMP"

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Fazer backup das configurações atuais
echo "Fazendo backup das configurações atuais..."
cp .env.production $BACKUP_DIR/ 2>/dev/null || true
cp docker-compose.yml $BACKUP_DIR/ 2>/dev/null || true

# Gerar docker-compose para produção
echo "Gerando docker-compose para produção..."
cat > docker-compose.production.yml << 'EOF'
version: '3.8'

services:
  nextjs:
    image: ${IMAGE_NAME}:${IMAGE_TAG}
    container_name: fgc-nextjs-production
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    networks:
      - fgc_network
    depends_on:
      - postgres
      - redis
      - minio
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  postgres:
    image: postgres:15
    container_name: fgc-postgres-production
    restart: always
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-fgc}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-fgc_password}
      POSTGRES_DB: ${POSTGRES_DB:-fgc_prod}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - fgc_network
    deploy:
      resources:
        limits:
          memory: 500M
        reservations:
          memory: 300M

  redis:
    image: redis:7-alpine
    container_name: fgc-redis-production
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD:-fgc_password}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - fgc_network
    deploy:
      resources:
        limits:
          memory: 200M
        reservations:
          memory: 100M

  minio:
    image: minio/minio
    container_name: fgc-minio-production
    restart: always
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY:-fgc_admin}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY:-fgc_password}
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    networks:
      - fgc_network
    deploy:
      resources:
        limits:
          memory: 400M
        reservations:
          memory: 200M

  evolution-api:
    image: evolution/evolution-api:latest
    container_name: fgc-evolution-api-production
    restart: always
    ports:
      - "8080:8080"
    volumes:
      - evolution_instances:/evolution/instances
    networks:
      - fgc_network
    deploy:
      resources:
        limits:
          memory: 500M
        reservations:
          memory: 300M

networks:
  fgc_network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  minio_data:
  evolution_instances:
EOF

# Criar exemplo de .env.production para VPS
echo "Criando modelo de .env.production para VPS..."
cat > .env.production.vps.example << 'EOF'
# Arquivo de exemplo para .env.production na VPS
# Substitua os valores conforme necessário para seu ambiente de produção

# Database
DATABASE_URL="postgresql://fgc:fgc_password@postgres:5432/fgc_prod"

# NextAuth e configuração de URL base
NEXTAUTH_URL="https://seu-dominio.com.br"
NEXT_PUBLIC_BASE_URL="https://seu-dominio.com.br"
NEXTAUTH_SECRET=gere_um_secret_seguro_aqui

# Mercado Pago (Produção)
NEXT_PUBLIC_MP_PUBLIC_KEY="CHAVE_PUBLICA_PRODUCAO"
MP_ACCESS_TOKEN="TOKEN_ACESSO_PRODUCAO"
MP_WEBHOOK_SECRET="SECRET_WEBHOOK_PRODUCAO"

# PagSeguro (Produção)
PAGSEGURO_EMAIL="seu-email-pagseguro@exemplo.com"
PAGSEGURO_TOKEN="SEU_TOKEN_PAGSEGURO_PRODUCAO"
PAGSEGURO_WEBHOOK_SECRET="SECRET_WEBHOOK_PAGSEGURO"

# Storage (MinIO)
STORAGE_TYPE="minio"
MINIO_ENDPOINT="http://minio:9000"
MINIO_ACCESS_KEY="fgc_admin"
MINIO_SECRET_KEY="fgc_password"
MINIO_BUCKET="fgc"
MINIO_REGION="us-east-1"
MINIO_PUBLIC_URL="https://storage.seu-dominio.com.br"

# Redis (Cache)
REDIS_URL="redis://:fgc_password@redis:6379"
REDIS_PASSWORD="fgc_password"

# Email (Produção)
SMTP_HOST=smtp.seu-provedor.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=seu-usuario-smtp
SMTP_PASS=sua-senha-smtp
SMTP_FROM_NAME=FGC Notificações
SMTP_FROM_EMAIL=no-reply@seu-dominio.com.br

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=SUA_CHAVE_GOOGLE_MAPS

# WhatsApp API (Evolution)
WHATSAPP_API_URL="http://evolution-api:8080"
WHATSAPP_API_BASE_PATH="/manager/"
WHATSAPP_INSTANCE="federacao"
WHATSAPP_WEBHOOK_SECRET="seu-webhook-secret"
WHATSAPP_API_KEY="sua-api-key"

# Configurações do Webhook
WEBHOOK_URL="https://seu-dominio.com.br/api/webhooks/whatsapp"

# Configurações de Notificação
NOTIFICATION_WHATSAPP_ENABLED=true
NOTIFICATION_EMAIL_ENABLED=true
NOTIFICATION_MAX_RETRIES=3
NOTIFICATION_DEFAULT_CHANNEL="whatsapp"

# Email From
EMAIL_FROM="${SMTP_FROM_EMAIL}"

# Nível de logging
LOG_LEVEL="error"

# Variáveis específicas de produção
NODE_ENV="production"
NEXT_TELEMETRY_DISABLED=1
SKIP_ENV_VALIDATION=true

# Variáveis para banco de dados
POSTGRES_USER=fgc
POSTGRES_PASSWORD=fgc_password
POSTGRES_DB=fgc_prod
EOF

# Criar script de deploy
echo "Criando script de deploy para a VPS..."
cat > deploy-to-vps.sh << 'EOF'
#!/bin/bash
# Script para deploy na VPS
# Uso: ./deploy-to-vps.sh usuario@ip-da-vps

if [ $# -ne 1 ]; then
  echo "Uso: $0 usuario@ip-da-vps"
  exit 1
fi

VPS_SSH=$1
TIMESTAMP=$(date +%Y%m%d%H%M%S)

# Construir a imagem final para produção
echo "Construindo imagem final para produção..."
docker build -t fgc-app:production .

# Salvar a imagem como arquivo tar
echo "Salvando imagem como arquivo tar..."
docker save fgc-app:production | gzip > fgc-app-production.tar.gz

# Copiar arquivos necessários para a VPS
echo "Copiando arquivos para a VPS..."
scp fgc-app-production.tar.gz docker-compose.production.yml .env.production.vps.example $VPS_SSH:~/fgc/

# Enviar script de instalação para a VPS
cat > vps-install.sh << 'EOFVPS'
#!/bin/bash
# Script de instalação na VPS

cd ~/fgc

# Verificar se .env.production existe, caso contrário, criar a partir do exemplo
if [ ! -f ".env.production" ]; then
  echo "Arquivo .env.production não encontrado. Criando a partir do exemplo..."
  cp .env.production.vps.example .env.production
  echo "⚠️ ATENÇÃO: Edite o arquivo .env.production com as configurações corretas!"
  echo "Execute: nano .env.production"
  exit 1
fi

# Carregar a imagem Docker
echo "Carregando imagem Docker..."
docker load < fgc-app-production.tar.gz

# Iniciar os containers
echo "Iniciando containers..."
docker-compose -f docker-compose.production.yml up -d

echo "===== DEPLOY CONCLUÍDO ====="
echo "Verifique se os containers estão em execução com: docker ps"
EOFVPS

chmod +x vps-install.sh
scp vps-install.sh $VPS_SSH:~/fgc/

echo "===== PREPARAÇÃO CONCLUÍDA ====="
echo "Arquivos necessários foram gerados."
echo ""
echo "Para realizar o deploy na VPS:"
echo "1. Execute: ./deploy-to-vps.sh usuario@ip-da-vps"
echo "2. Conecte-se à VPS: ssh usuario@ip-da-vps"
echo "3. Na VPS, execute: cd ~/fgc && ./vps-install.sh"
echo "4. Configure o .env.production na VPS conforme necessário"
echo ""
echo "Arquivos gerados:"
echo "- docker-compose.production.yml: Configuração dos containers para produção"
echo "- .env.production.vps.example: Exemplo de variáveis de ambiente para produção"
echo "- deploy-to-vps.sh: Script para enviar arquivos para a VPS"
echo "- vps-install.sh: Script de instalação que será executado na VPS"
