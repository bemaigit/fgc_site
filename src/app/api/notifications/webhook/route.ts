import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Endpoint para receber callbacks da Evolution API
 * 
 * Este endpoint recebe eventos de status de mensagens e
 * atualiza o banco de dados com informações de entrega
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar assinatura do webhook
    const signature = req.headers.get('x-signature');
    const body = await req.text();
    
    // Verificar a assinatura se estiver configurada
    if (process.env.EVOLUTION_WEBHOOK_SECRET) {
      if (!signature) {
        console.error('Webhook sem assinatura');
        return NextResponse.json({ error: 'Assinatura ausente' }, { status: 401 });
      }
      
      // Calcular hash usando o segredo compartilhado
      const hmac = crypto
        .createHmac('sha256', process.env.EVOLUTION_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');
        
      if (signature !== `sha256=${hmac}`) {
        console.error('Assinatura inválida do webhook');
        return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
      }
    }
    
    // Processar o callback
    const data = JSON.parse(body);
    console.log('Webhook recebido da Evolution API:', JSON.stringify(data, null, 2));
    
    // Verificar tipo de evento
    if (!data.event || !data.data) {
      return NextResponse.json({ error: 'Formato de webhook inválido' }, { status: 400 });
    }
    
    // Processar com base no tipo de evento
    switch (data.event) {
      case 'message.status':
        await handleMessageStatus(data.data);
        break;
        
      case 'message.received':
        await handleMessageReceived(data.data);
        break;
        
      case 'connection.update':
        await handleConnectionUpdate(data.data);
        break;
        
      default:
        console.log(`Evento não processado: ${data.event}`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao processar webhook:', error);
    return NextResponse.json({ 
      error: 'Erro ao processar webhook', 
      message: error.message 
    }, { status: 500 });
  }
}

/**
 * Processa eventos de status de mensagem
 */
async function handleMessageStatus(data: any) {
  const { 
    id, 
    status, 
    conversationId = null, 
    timestamp = null,
    error = null
  } = data;
  
  if (!id) {
    console.error('ID da mensagem ausente no webhook de status');
    return;
  }
  
  // Buscar notificação pelo ID externo
  const attempt = await prisma.notificationAttempt.findFirst({
    where: {
      providerId: id,
    },
  });
  
  if (!attempt) {
    console.log(`Nenhuma tentativa encontrada para o ID externo: ${id}`);
    return;
  }
  
  // Mapear status da Evolution API para status interno
  let notificationStatus;
  switch (status) {
    case 'sent':
      notificationStatus = 'sent';
      break;
    case 'delivered':
      notificationStatus = 'delivered';
      break;
    case 'read':
      notificationStatus = 'read';
      break;
    case 'failed':
      notificationStatus = 'failed';
      break;
    default:
      notificationStatus = status;
  }
  
  // Atualizar tentativa de notificação
  await prisma.notificationAttempt.update({
    where: { id: attempt.id },
    data: {
      // Convertendo status para booleano (success)
      success: ['delivered', 'read'].includes(notificationStatus),
      // Armazenamos o erro como string
      error: error ? JSON.stringify(error) : null,
    },
  });
  
  // Atualizar status da notificação principal
  // Apenas se o status atual não for "final" (entregue ou falha)
  const notification = await prisma.notification.findUnique({
    where: { id: attempt.notificationId }
  });
  
  if (notification && !['delivered', 'read', 'failed'].includes(notification.status)) {
    await prisma.notification.update({
      where: { id: attempt.notificationId },
      data: {
        status: notificationStatus,
        updatedAt: new Date(),
      },
    });
  }
  
  // Registrar log
  await prisma.notificationLog.create({
    data: {
      id: crypto.randomUUID(),
      type: notificationStatus,
      recipient: attempt.notificationId, 
      channel: attempt.channel,
      status: notificationStatus,
      metadata: {
        messageId: id,
        timestamp: timestamp || new Date().toISOString()
      },
      sentAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

/**
 * Processa mensagens recebidas (respostas)
 */
async function handleMessageReceived(data: any) {
  const { 
    from, 
    text, 
    timestamp = Date.now(),
    conversationId = null,
  } = data;
  
  if (!from) {
    console.error('Remetente ausente no webhook de mensagem recebida');
    return;
  }
  
  // Normalizar número de telefone
  const normalizedPhone = normalizePhoneNumber(from);
  
  // Buscar a última notificação enviada para este número
  const lastNotification = await prisma.notification.findFirst({
    where: {
      recipient: normalizedPhone,
      status: { in: ['sent', 'delivered', 'read'] },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
  
  // Registrar resposta recebida
  if (lastNotification) {
    await prisma.notificationLog.create({
      data: {
        id: crypto.randomUUID(),
        type: 'message_received',
        recipient: normalizedPhone,
        channel: 'whatsapp',
        status: 'received',
        metadata: {
          notificationId: lastNotification.id,
          from: normalizedPhone,
          text,
          conversationId,
          timestamp: new Date(timestamp).toISOString()
        },
        sentAt: new Date(timestamp),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } else {
    // Registrar log genérico se não encontrar notificação relacionada
    await prisma.notificationLog.create({
      data: {
        id: crypto.randomUUID(),
        type: 'unknown_message',
        recipient: normalizedPhone,
        channel: 'whatsapp',
        status: 'received',
        metadata: {
          from: normalizedPhone,
          text,
          conversationId,
          timestamp: new Date(timestamp).toISOString()
        },
        sentAt: new Date(timestamp),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}

/**
 * Processa atualizações de status de conexão
 */
async function handleConnectionUpdate(data: any) {
  const { 
    instance, 
    state, 
    statusReason = null 
  } = data;
  
  if (!instance || !state) {
    console.error('Dados insuficientes no webhook de atualização de conexão');
    return;
  }
  
  // Registrar log de conexão
  await prisma.notificationLog.create({
    data: {
      id: crypto.randomUUID(),
      type: 'connection_status',
      recipient: 'system',
      channel: 'whatsapp',
      status: state,
      metadata: {
        instance,
        state,
        statusReason,
        timestamp: new Date().toISOString()
      },
      sentAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  
  // Se houve desconexão, registrar em configuração
  if (state === 'disconnected' || state === 'connecting') {
    // Buscar configuração atual
    const config = await prisma.notificationConfig.findFirst();
    
    // Atualizar ou criar configuração
    if (config) {
      await prisma.notificationConfig.update({
        where: { id: config.id },
        data: {
          // Desativar WhatsApp se estiver desconectado
          whatsappEnabled: state !== 'disconnected',
          // Atualizar o timestamp
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.notificationConfig.create({
        data: {
          id: crypto.randomUUID(),
          whatsappEnabled: false,
          emailEnabled: true,
          webhookEnabled: false,
          updatedAt: new Date(),
        },
      });
    }
  }
}

/**
 * Normaliza número de telefone para formato consistente
 */
function normalizePhoneNumber(phone: string): string {
  // Remover todos os caracteres não numéricos
  let normalized = phone.replace(/\D/g, '');
  
  // Remover prefixos como "+" ou "whatsapp:"
  normalized = normalized.replace(/^whatsapp:/, '');
  
  // Garantir formato com código do país
  if (normalized.length === 11) {
    // Assume um número brasileiro sem código do país
    normalized = `55${normalized}`;
  } else if (normalized.length === 10) {
    // Assume um número brasileiro sem código do país e sem o 9
    normalized = `55${normalized}`;
  }
  
  return normalized;
}
