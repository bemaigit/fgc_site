#!/bin/bash
# Script de build e teste local
# Criado em: 02/06/2025

echo "=== PROCESSO DE BUILD DO SISTEMA FGC ==="
echo "Iniciando processo de build e teste local..."

# Definir variáveis
CONTAINER_NAME="fgc-app-test"
IMAGE_NAME="fgc-app"
IMAGE_TAG="test-build"

# Verificar se o script de verificação existe e executá-lo
if [ -f "./scripts/build-check.sh" ]; then
  chmod +x ./scripts/build-check.sh
  ./scripts/build-check.sh
  
  # Verificar se a verificação foi bem-sucedida
  if [ $? -ne 0 ]; then
    echo "❌ Verificação pré-build falhou. Corrija os erros antes de prosseguir."
    exit 1
  fi
else
  echo "⚠️ Script de verificação não encontrado. Pulando verificações..."
fi

# Remover container anterior se existir
echo "Removendo container de teste anterior se existir..."
docker rm -f $CONTAINER_NAME 2>/dev/null || true

# Construir a imagem Docker
echo "Construindo imagem Docker..."
docker build -t $IMAGE_NAME:$IMAGE_TAG .

# Verificar se o build foi bem-sucedido
if [ $? -ne 0 ]; then
  echo "❌ Build da imagem Docker falhou."
  exit 1
else
  echo "✅ Imagem Docker construída com sucesso: $IMAGE_NAME:$IMAGE_TAG"
fi

# Executar a imagem para teste
echo "Iniciando container para teste..."
docker run -d --name $CONTAINER_NAME \
  -p 3000:3000 \
  --network="host" \
  --env-file .env.production \
  $IMAGE_NAME:$IMAGE_TAG

# Verificar se o container iniciou corretamente
if [ $? -ne 0 ]; then
  echo "❌ Falha ao iniciar o container de teste."
  exit 1
else
  echo "✅ Container de teste iniciado com sucesso."
fi

# Aguardar a inicialização da aplicação
echo "Aguardando inicialização da aplicação (30s)..."
sleep 30

# Testar se a aplicação está respondendo
echo "Testando resposta da aplicação..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep 200

if [ $? -ne 0 ]; then
  echo "❌ A aplicação não está respondendo corretamente."
  docker logs $CONTAINER_NAME
  echo "Verifique os logs acima para mais detalhes."
else
  echo "✅ Aplicação está respondendo corretamente."
fi

echo ""
echo "===== TESTE CONCLUÍDO ====="
echo "A imagem $IMAGE_NAME:$IMAGE_TAG está pronta para testes manuais."
echo "Para ver os logs do container: docker logs $CONTAINER_NAME"
echo "Para parar o container: docker stop $CONTAINER_NAME"
echo "Para iniciar o container novamente: docker start $CONTAINER_NAME"
echo ""
echo "Acesse a aplicação em: http://localhost:3000"
