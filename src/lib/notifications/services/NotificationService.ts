import { prisma } from '@/lib/prisma';
import { queueNotification, NotificationJob } from '../queue/notificationQueue';
import { v4 as uuidv4 } from 'uuid';

// Interface para envio de notificação
export interface SendNotificationParams {
  recipient: string;
  content: string;
  channel: 'whatsapp' | 'email' | 'sms';
  type: string;
  templateId?: string;
  priority?: 'low' | 'normal' | 'high';
  metadata?: Record<string, any>;
}

/**
 * Serviço para gerenciamento de notificações
 */
export class NotificationService {
  /**
   * Envia uma notificação através da fila
   */
  async sendNotification(params: SendNotificationParams) {
    console.log('📤 Enviando notificação para:', params.recipient);

    // Verificar se o canal está habilitado
    if (params.channel === 'whatsapp' && process.env.NOTIFICATION_WHATSAPP_ENABLED !== 'true') {
      throw new Error('Canal WhatsApp não está habilitado');
    }
    
    if (params.channel === 'email' && process.env.NOTIFICATION_EMAIL_ENABLED !== 'true') {
      throw new Error('Canal Email não está habilitado');
    }

    try {
      // Gerar ID único para a notificação
      const notificationId = uuidv4();
      
      // Criar registro de notificação no banco de dados
      const notification = await prisma.notification.create({
        data: {
          id: notificationId,
          recipient: params.recipient,
          type: params.type,
          priority: params.priority || 'normal',
          status: 'pending',
          updatedAt: new Date()
        }
      });

      // Preparar trabalho para a fila
      const job: NotificationJob = {
        id: notification.id,
        recipient: params.recipient,
        content: params.content,
        channel: params.channel,
        type: params.type,
        priority: (params.priority as 'low' | 'normal' | 'high') || 'normal',
        templateId: params.templateId,
        metadata: params.metadata
      };

      // Adicionar à fila apropriada
      await queueNotification(job);

      return {
        success: true,
        notificationId: notification.id,
        status: 'queued'
      };
    } catch (error: any) {
      console.error('Erro ao enfileirar notificação:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Busca o status de uma notificação
   */
  async getNotificationStatus(notificationId: string) {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
        include: {
          NotificationAttempt: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      if (!notification) {
        return {
          success: false,
          error: 'Notificação não encontrada'
        };
      }

      const lastAttempt = notification.NotificationAttempt[0];

      return {
        success: true,
        status: notification.status,
        attempts: notification.NotificationAttempt.length,
        lastAttempt: lastAttempt ? {
          success: lastAttempt.success,
          time: lastAttempt.createdAt,
          error: lastAttempt.error
        } : null
      };
    } catch (error: any) {
      console.error('Erro ao buscar status da notificação:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cancela uma notificação pendente
   */
  async cancelNotification(notificationId: string) {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId }
      });

      if (!notification) {
        return {
          success: false,
          error: 'Notificação não encontrada'
        };
      }

      if (notification.status !== 'pending') {
        return {
          success: false,
          error: `Não é possível cancelar notificação com status ${notification.status}`
        };
      }

      // Atualizar status da notificação
      await prisma.notification.update({
        where: { id: notificationId },
        data: { 
          status: 'cancelled',
          updatedAt: new Date()
        }
      });

      // Nota: O trabalho já pode ter sido retirado da fila pelo worker,
      // mas atualizamos o status no banco de dados de qualquer forma

      return {
        success: true,
        status: 'cancelled'
      };
    } catch (error: any) {
      console.error('Erro ao cancelar notificação:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
