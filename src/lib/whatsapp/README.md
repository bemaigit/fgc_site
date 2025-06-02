# Serviço de WhatsApp com Evolution API

Este serviço fornece uma interface para interagir com a Evolution API para envio e recebimento de mensagens do WhatsApp.

## Configuração

Adicione as seguintes variáveis de ambiente no seu arquivo `.env`:

```env
# URL da API do Evolution
WHATSAPP_API_URL=http://localhost:8080

# Chave de API do Evolution
WHATSAPP_API_KEY=sua_chave_aqui

# Segredo para validação do webhook
WHATSAPP_WEBHOOK_SECRET=seu_segredo_aqui

# URL base da sua aplicação (para configuração do webhook)
NEXTAUTH_URL=http://localhost:3000
```

## Uso

### Importação

```typescript
import { evolutionService } from '@/lib/whatsapp/evolution-service';
```

### Criar uma nova instância

```typescript
try {
  const instance = await evolutionService.createInstance('nome-da-instancia');
  console.log('Instância criada:', instance);
} catch (error) {
  console.error('Erro ao criar instância:', error);
}
```

### Iniciar uma instância

Inicia o processo de autenticação, retornando um QR code para escanear.

```typescript
try {
  const result = await evolutionService.startInstance('nome-da-instancia');
  console.log('QR Code:', result.data.qrcode?.base64);
} catch (error) {
  console.error('Erro ao iniciar instância:', error);
}
```

### Obter status de uma instância

```typescript
try {
  const status = await evolutionService.getInstanceStatus('nome-da-instancia');
  console.log('Status:', status);
} catch (error) {
  console.error('Erro ao obter status:', error);
}
```

### Enviar uma mensagem de texto

```typescript
try {
  const message = await evolutionService.sendTextMessage(
    'nome-da-instancia',
    '5511999999999@c.us',
    'Olá, esta é uma mensagem de teste!'
  );
  console.log('Mensagem enviada:', message);
} catch (error) {
  console.error('Erro ao enviar mensagem:', error);
}
```

### Webhook

O webhook está configurado para receber eventos da Evolution API em `/api/webhooks/whatsapp`. Ele processa os seguintes eventos:

- `connection.update`: Atualizações de status de conexão
- `messages.upsert`: Novas mensagens recebidas
- `messages.update`: Atualizações de mensagens
- `presence.update`: Atualizações de presença
- `groups.upsert`: Grupos criados/atualizados
- `groups.update`: Atualizações de grupos
- `groups.participants.update`: Atualizações de participantes de grupos

## Fluxo de Autenticação

1. **Criar uma instância**: `createInstance('nome-da-instancia')`
2. **Iniciar a instância**: `startInstance('nome-da-instancia')`
3. **Escanear o QR Code** retornado
4. **Enviar mensagens**: `sendTextMessage('nome-da-instancia', 'numero@c.us', 'Mensagem')`

## Tratamento de Erros

Todos os métodos lançam erros que podem ser capturados com blocos `try/catch`. As mensagens de erro são descritivas e incluem detalhes da resposta da API quando disponíveis.

## Segurança

- Todas as requisições para a Evolution API são autenticadas com a chave de API
- O webhook valida a assinatura das requisições usando o segredo configurado
- Recomenda-se usar HTTPS em produção

## Monitoramento

O serviço inclui logs detalhados para facilitar a depuração. Verifique os logs do servidor para acompanhar o fluxo de mensagens e eventos.
