import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { notificationQueue } from '@/lib/notifications/queue/notification-queue';
import { prisma } from '@/lib/prisma';
import { INotificationPayload } from '@/lib/notifications/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as crypto from 'crypto';

// Schema para validação da notificação
const NotificationSchema = z.object({
  recipient: z.string().min(1, "Destinatário é obrigatório"),
  channel: z.enum(["whatsapp", "email", "sms"]).default("whatsapp"),
  templateId: z.string().optional(),
  type: z.string().default("MANUAL"),
  subject: z.string().optional(),
  content: z.string().min(1, "Conteúdo da mensagem é obrigatório"),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  variables: z.record(z.string()).optional(),
  attachments: z.array(z.object({
    url: z.string(),
    name: z.string().optional(),
    type: z.string().optional(),
  })).optional(),
  metadata: z.record(z.any()).optional(),
  sendAt: z.string().datetime().optional(),
});

// Schema para validação de envio em lote
const BatchNotificationSchema = z.object({
  notifications: z.array(NotificationSchema),
  delayBetweenNotifications: z.number().min(0).max(5000).default(500),
});

/**
 * Endpoint para enviar uma única notificação
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Extrair e validar dados
    const data = await req.json();
    const result = NotificationSchema.safeParse(data);

    if (!result.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: result.error.format() 
      }, { status: 400 });
    }

    const payload = result.data;
    
    // Preparar payload para a fila
    const notificationPayload: INotificationPayload = {
      id: crypto.randomUUID(),
      type: payload.type,
      recipient: payload.recipient,
      channel: payload.channel,
      content: payload.content,
      subject: payload.subject,
      templateId: payload.templateId,
      priority: payload.priority,
      variables: payload.variables,
      metadata: {
        ...payload.metadata,
        userId: session.user.id,
        username: session.user.name || session.user.email,
        attachments: payload.attachments
      },
      sendAt: payload.sendAt
    };

    // Se for envio agendado
    if (payload.sendAt) {
      const sendAtDate = new Date(payload.sendAt);
      if (sendAtDate <= new Date()) {
        return NextResponse.json({ 
          error: 'Data de agendamento deve ser no futuro' 
        }, { status: 400 });
      }
    }

    // Adicionar à fila de notificações
    const notificationId = await notificationQueue.addToQueue(notificationPayload);

    return NextResponse.json({ 
      success: true,
      message: payload.sendAt 
        ? 'Notificação agendada com sucesso' 
        : 'Notificação enviada para a fila',
      id: notificationId,
      status: 'queued'
    });
  } catch (error) {
    console.error('Erro ao processar envio de notificação:', error);
    return NextResponse.json({ 
      error: 'Falha ao processar envio', 
      details: (error as Error).message 
    }, { status: 500 });
  }
}

/**
 * Endpoint para enviar notificações em lote
 */
export async function PUT(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Extrair e validar dados
    const data = await req.json();
    const result = BatchNotificationSchema.safeParse(data);

    if (!result.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: result.error.format() 
      }, { status: 400 });
    }

    const { notifications, delayBetweenNotifications } = result.data;
    
    // Verificar limite de notificações
    const MAX_BATCH_SIZE = parseInt(process.env.MAX_NOTIFICATION_BATCH_SIZE || '100', 10);
    if (notifications.length > MAX_BATCH_SIZE) {
      return NextResponse.json({ 
        error: `Número máximo de notificações por lote excedido (${MAX_BATCH_SIZE})` 
      }, { status: 400 });
    }
    
    // Processar cada notificação
    const notificationIds: string[] = [];
    let currentDelay = 0;
    
    for (const notification of notifications) {
      // Preparar payload para a fila
      const notificationId = crypto.randomUUID();
      
      const notificationPayload: INotificationPayload = {
        id: notificationId,
        type: notification.type,
        recipient: notification.recipient,
        channel: notification.channel,
        content: notification.content,
        subject: notification.subject,
        templateId: notification.templateId,
        priority: notification.priority,
        variables: notification.variables,
        metadata: {
          ...notification.metadata,
          userId: session.user.id,
          username: session.user.name || session.user.email,
          attachments: notification.attachments,
          batchId: crypto.randomUUID(), // ID para agrupar o lote
          batchIndex: notificationIds.length,
        }
      };

      // Adicionar à fila com delay incremental para evitar sobrecarga
      if (currentDelay > 0) {
        const sendAt = new Date(Date.now() + currentDelay);
        notificationPayload.sendAt = sendAt.toISOString();
      }
      
      await notificationQueue.addToQueue(notificationPayload);
      notificationIds.push(notificationId);
      
      // Incrementar delay para a próxima notificação
      currentDelay += delayBetweenNotifications;
    }

    return NextResponse.json({ 
      success: true,
      message: `${notificationIds.length} notificações enviadas para a fila`,
      ids: notificationIds
    });
  } catch (error) {
    console.error('Erro ao processar envio em lote:', error);
    return NextResponse.json({ 
      error: 'Falha ao processar envio em lote', 
      details: (error as Error).message 
    }, { status: 500 });
  }
}

/**
 * Endpoint para enviar uma notificação imediatamente (bypass da fila)
 * Usado apenas para casos excepcionais ou testes
 */
export async function PATCH(req: NextRequest) {
  try {
    // Verificar autenticação e privilégios admin
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      console.log('Acesso negado. Role do usuário:', session?.user?.role);
      return NextResponse.json({ error: 'Operação não autorizada. Requer ADMIN ou SUPER_ADMIN.' }, { status: 403 });
    }
    
    console.log('Autorização concedida para envio direto. Role do usuário:', session.user.role);

    // Extrair e validar dados
    const data = await req.json();
    const result = NotificationSchema.safeParse(data);

    if (!result.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: result.error.format() 
      }, { status: 400 });
    }

    const payload = result.data;
    
    // Primeiro, criar o registro da notificação
    const notificationId = crypto.randomUUID();
    
    const notification = await prisma.notification.create({
      data: {
        id: notificationId,
        type: payload.type,
        recipient: payload.recipient,
        status: 'processing',
        priority: payload.priority,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    try {
      // Tentar enviar diretamente (bypassando a fila)
      // Este método pode depender da implementação específica de cada canal
      // Vamos usar uma abordagem simplificada aqui

      // Criar registro de tentativa
      const attemptId = `${notificationId}_direct_${Date.now()}`;
      await prisma.notificationAttempt.create({
        data: {
          id: attemptId,
          notificationId,
          channel: payload.channel,
          success: false, // Será atualizado após o envio
          createdAt: new Date()
        }
      });
      
      // Determinar o canal e enviar
      let result;
      
      if (payload.channel === 'whatsapp') {
        // Importar o adaptador de WhatsApp diretamente
        const { default: WhatsAppAdapter } = await import('@/lib/notifications/adapters/whatsapp-adapter');
        const adapter = new WhatsAppAdapter();
        
        result = await adapter.sendTextMessage(
          payload.recipient,
          payload.content
        );
      } 
      else if (payload.channel === 'email') {
        // Implementação de e-mail (para ser implementada)
        throw new Error('Envio de email direto não implementado');
      }
      else {
        throw new Error(`Canal não suportado: ${payload.channel}`);
      }
      
      // Atualizar a tentativa e a notificação
      await prisma.notificationAttempt.update({
        where: { id: attemptId },
        data: {
          success: true,
          providerId: result?.messageId || 'direct-send'
        }
      });
      
      await prisma.notification.update({
        where: { id: notificationId },
        data: { 
          status: 'delivered',
          updatedAt: new Date()
        }
      });

      return NextResponse.json({ 
        success: true,
        message: 'Notificação enviada diretamente',
        id: notificationId,
        result
      });
    } 
    catch (error) {
      // Em caso de erro, atualizar status da notificação
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'failed' }
      });
      
      throw error; // Propagar o erro para ser capturado abaixo
    }
  } catch (error) {
    console.error('Erro ao enviar notificação diretamente:', error);
    return NextResponse.json({ 
      error: 'Falha ao enviar notificação', 
      details: (error as Error).message 
    }, { status: 500 });
  }
}
