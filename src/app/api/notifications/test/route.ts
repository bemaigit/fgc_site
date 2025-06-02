import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import NotificationService from '@/lib/notifications/notification-service';
import { isValidPhoneNumber } from '@/utils/validation';

const prisma = new PrismaClient();

/**
 * Endpoint para testes do sistema de notificações
 * Permite enviar mensagens de teste para diferentes canais
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      recipient, 
      message, 
      channel = 'whatsapp', 
      type = 'test',
      priority = 'high' 
    } = data;

    console.log('\n[TESTE NOTIFICAÇÃO] Iniciando teste de envio');
    console.log(`[TESTE NOTIFICAÇÃO] Destinatário: ${recipient}`); 
    console.log(`[TESTE NOTIFICAÇÃO] Canal: ${channel}`);
    console.log(`[TESTE NOTIFICAÇÃO] Mensagem: ${message?.substring(0, 50)}${message?.length > 50 ? '...' : ''}`);
    
    // Validações básicas
    if (!recipient) {
      console.error('[TESTE NOTIFICAÇÃO] Erro: Destinatário não informado');
      return NextResponse.json({ 
        success: false, 
        error: 'Destinatário (recipient) é obrigatório' 
      }, { status: 400 });
    }

    if (!message) {
      console.error('[TESTE NOTIFICAÇÃO] Erro: Mensagem não informada');
      return NextResponse.json({ 
        success: false, 
        error: 'Mensagem (message) é obrigatória' 
      }, { status: 400 });
    }

    // Validação especial para WhatsApp
    if (channel === 'whatsapp') {
      if (!isValidPhoneNumber(recipient)) {
        console.error(`[TESTE NOTIFICAÇÃO] Erro: Número de telefone inválido: "${recipient}"`);
        return NextResponse.json({ 
          success: false, 
          error: `Formato de número de telefone inválido: "${recipient}". Use o formato internacional, ex: 5562994242329` 
        }, { status: 400 });
      }
      
      // Verificar conexão com o WhatsApp antes de tentar enviar
      const notificationService = new NotificationService();
      const connectionStatus = await notificationService.checkWhatsAppStatus();
      
      console.log(`[TESTE NOTIFICAÇÃO] Status WhatsApp: ${JSON.stringify(connectionStatus)}`);
      
      if (connectionStatus?.status !== 'connected') {
        console.error(`[TESTE NOTIFICAÇÃO] Erro: WhatsApp não está conectado: ${connectionStatus?.message}`);
        return NextResponse.json({ 
          success: false, 
          error: `WhatsApp não está conectado: ${connectionStatus?.message}`,
          connectionStatus
        }, { status: 500 });
      }
    }

    // Cria o serviço de notificações
    const notificationService = new NotificationService();
    
    // Envia a notificação
    console.log(`Enviando notificação de teste para ${recipient} via ${channel}`);
    const notification = await notificationService.sendNotification({
      recipient,
      content: message,
      channel,
      type,
      priority,
      metadata: {
        isTest: true,
        source: 'api-test',
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      notificationId: notification.id,
      channel,
      recipient,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Erro ao enviar notificação de teste:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * Endpoint para verificar o status de uma notificação
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID da notificação não fornecido' 
      }, { status: 400 });
    }

    // Busca a notificação
    const notification = await prisma.notification.findUnique({
      where: { id }
    });
    
    // Buscar as tentativas de envio separadamente
    const attempts = await prisma.notificationAttempt.findMany({
      where: { notificationId: id },
      orderBy: { createdAt: 'desc' }
    });

    if (!notification) {
      return NextResponse.json({ 
        success: false, 
        error: 'Notificação não encontrada' 
      }, { status: 404 });
    }

    // Busca os logs específicos dessa notificação
    const logs = await prisma.notificationLog.findMany({
      where: {
        OR: [
          { metadata: { path: ['notificationId'], equals: id } },
          { type: notification.type, recipient: notification.recipient }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return NextResponse.json({
      success: true,
      notification,
      attempts,
      logs,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Erro ao buscar status da notificação:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
