import { PrismaClient, Notification, NotificationAttempt } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import WhatsAppAdapter from './adapters/whatsapp-adapter';
import { INotificationPayload, NotificationChannel, NotificationPriority, NotificationStatus } from './types';

const prisma = new PrismaClient();

/**
 * Serviço de notificações que gerencia o envio para diferentes canais
 */
export class NotificationService {
  private whatsappAdapter: WhatsAppAdapter;
  
  constructor() {
    this.whatsappAdapter = new WhatsAppAdapter();
  }

  /**
   * Retorna o adapter para envio de WhatsApp
   * @returns Adapter WhatsApp
   */
  getWhatsAppAdapter(): WhatsAppAdapter {
    return this.whatsappAdapter;
  }
  
  /**
   * Verifica o status de conexão do WhatsApp
   * @returns Status de conexão
   */
  async checkWhatsAppStatus(): Promise<any> {
    try {
      console.log('[NotificationService] Verificando status do WhatsApp...');
      const status = await this.whatsappAdapter.checkConnectionStatus();
      console.log(`[NotificationService] Status do WhatsApp: ${status.status} - ${status.message}`);
      return status;
    } catch (error: any) {
      console.error('[NotificationService] Erro ao verificar status do WhatsApp:', error.message);
      return {
        status: 'error',
        message: `Erro ao verificar status: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Envia uma notificação através do canal especificado
   * @param payload Dados da notificação
   * @returns A notificação criada
   */
  async sendNotification(payload: INotificationPayload): Promise<Notification> {
    // Define o canal padrão se não for especificado
    const channel = payload.channel || process.env.NOTIFICATION_DEFAULT_CHANNEL || 'whatsapp';
    
    // Cria o registro da notificação no banco de dados
    const notification = await this.createNotificationRecord({
      ...payload
    });
    
    // Tenta enviar a notificação imediatamente (sem fila por enquanto)
    await this.processNotification(notification.id, channel, payload.content, payload.metadata || {});
    
    return notification;
  }

  /**
   * Processa o envio de uma notificação pelo canal apropriado
   * @param notificationId ID da notificação
   */
  async processNotification(
    notificationId: string, 
    channel: string, 
    content: string, 
    metadata: any = {}
  ): Promise<void> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });
    
    if (!notification) {
      throw new Error(`Notificação ${notificationId} não encontrada`);
    }
    
    if (notification.status !== 'pending') {
      return; // Se não estiver pendente, não processa novamente
    }
    
    try {
      let result;
      
      // Envia pelo canal apropriado
      if (channel === 'whatsapp' && process.env.NOTIFICATION_WHATSAPP_ENABLED === 'true') {
        result = await this.sendWhatsAppNotification(notification, content, metadata);
      } else if (channel === 'email' && process.env.NOTIFICATION_EMAIL_ENABLED === 'true') {
        result = await this.sendEmailNotification(notification, content, metadata);
      } else {
        throw new Error(`Canal ${channel} não configurado ou desabilitado`);
      }
      
      // Registra a tentativa de envio
      await this.createAttemptRecord(notification.id, channel, result.success, result.error);
      
      // Atualiza o status da notificação
      if (result.success) {
        await this.updateNotificationStatus(notification.id, 'delivered');
      } else {
        // Verifica se deve tentar novamente
        const maxRetries = Number(process.env.NOTIFICATION_MAX_RETRIES || '3');
        const attempts = await prisma.notificationAttempt.count({
          where: { notificationId: notification.id }
        });
        
        if (attempts >= maxRetries) {
          await this.updateNotificationStatus(notification.id, 'failed');
        }
      }
    } catch (error: any) {
      console.error(`Erro ao processar notificação ${notificationId}:`, error.message);
      await this.updateNotificationStatus(notification.id, 'failed');
    }
  }

  /**
   * Cria um registro de notificação no banco de dados
   * @param payload Dados da notificação
   * @returns Notificação criada
   */
  private async createNotificationRecord(payload: INotificationPayload): Promise<Notification> {
    return await prisma.notification.create({
      data: {
        id: uuidv4(),
        type: payload.type,
        recipient: payload.recipient,
        priority: payload.priority || 'normal',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  /**
   * Cria um registro de tentativa de envio
   * @param notificationId ID da notificação
   * @param channel Canal utilizado
   * @param success Indicador de sucesso
   * @param error Mensagem de erro (se houver)
   * @returns Tentativa criada
   */
  private async createAttemptRecord(
    notificationId: string,
    channel: string,
    success: boolean,
    error?: string
  ): Promise<NotificationAttempt> {
    return await prisma.notificationAttempt.create({
      data: {
        id: uuidv4(),
        notificationId,
        channel,
        success,
        error,
        createdAt: new Date()
      }
    });
  }

  /**
   * Atualiza o status de uma notificação
   * @param notificationId ID da notificação
   * @param status Novo status
   */
  private async updateNotificationStatus(
    notificationId: string, 
    status: string
  ): Promise<void> {
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Envia uma notificação via WhatsApp
   * @param notification Dados da notificação
   * @param content Conteúdo da mensagem
   * @param metadata Metadados adicionais
   * @returns Resultado do envio
   */
  private async sendWhatsAppNotification(
    notification: Notification,
    content: string,
    metadata: any = {}
  ): Promise<any> {
    try {
      console.log(`\n[NotificationService] Preparando envio de WhatsApp para ${notification.recipient}`);
      
      // Verificar se o destinatário é válido
      if (!notification.recipient || notification.recipient.trim().length < 8) {
        console.error(`[NotificationService] \u274c Número de telefone inválido: "${notification.recipient}"`);
        throw new Error(`Número de telefone inválido: ${notification.recipient}`);
      }
      
      // Verificar conexão com o WhatsApp antes de tentar enviar
      const connectionStatus = await this.whatsappAdapter.checkConnectionStatus();
      console.log(`[NotificationService] Status de conexão WhatsApp: ${connectionStatus.status} - ${connectionStatus.message}`);
      
      // Se não estiver conectado, registrar erro e sair
      if (connectionStatus.status !== 'connected') {
        console.error(`[NotificationService] \u274c Impossível enviar mensagem: WhatsApp não está conectado`);
        
        // Registrar a falha devido à falta de conexão
        await this.createAttemptRecord(
          notification.id, 
          'whatsapp', 
          false, 
          `WhatsApp não está conectado: ${connectionStatus.message}`
        );
        
        return {
          success: false,
          error: `WhatsApp não está conectado: ${connectionStatus.message}`
        };
      }
      
      // Verificar se o conteúdo da mensagem é válido
      if (!content || content.trim().length === 0) {
        console.error(`[NotificationService] \u274c Conteúdo da mensagem inválido ou vazio`);
        throw new Error('Conteúdo da mensagem inválido ou vazio');
      }
      
      console.log(`[NotificationService] Enviando mensagem para ${notification.recipient} (${content.length} caracteres)`);
      
      // Envia a mensagem via WhatsApp
      console.log(`Enviando mensagem para: ${notification.recipient}`);
      const result = await this.whatsappAdapter.sendTextMessage(
        notification.recipient,
        content
      );
      
      // Log detalhado do resultado
      if (result.success) {
        console.log(`[NotificationService] \u2705 Mensagem enviada com sucesso para ${notification.recipient}`);
        console.log(`[NotificationService] Message ID: ${result.messageId || 'N/A'}`);
      } else {
        console.error(`[NotificationService] \u274c Falha ao enviar mensagem: ${result.error}`);
      }
      
      // Registra a tentativa de envio
      await this.createAttemptRecord(
        notification.id, 
        'whatsapp', 
        result.success, 
        result.error || undefined
      );
      
      // Registra os metadados em log para diagnóstico
      console.log(`[NotificationService] Metadados de envio:`, {
        messageId: result.messageId,
        recipient: notification.recipient,
        messageLength: content.length,
        timestamp: new Date().toISOString(),
        ...metadata
      });
      
      return result;
    } catch (error: any) {
      console.error(`Erro ao enviar WhatsApp para ${notification.recipient}:`, error.message);
      
      // Registra o erro mesmo quando ocorre uma exceção
      await prisma.notificationLog.create({
        data: {
          id: uuidv4(),
          type: notification.type,
          recipient: notification.recipient,
          channel: 'whatsapp',
          status: 'failed',
          error: error.message,
          metadata: {
            error: error.message,
            stack: error.stack,
            notificationId: notification.id,
            timestamp: new Date().toISOString()
          },
          sentAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }).catch(logError => {
        console.error('Erro ao registrar falha de notificação:', logError.message);
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envia uma notificação via Email (a ser implementado)
   * @param notification Dados da notificação
   * @param content Conteúdo da mensagem
   * @param metadata Metadados adicionais
   * @returns Resultado do envio
   */
  private async sendEmailNotification(
    notification: Notification,
    content: string,
    metadata: any = {}
  ): Promise<any> {
    // A implementar futuramente com outro adaptador
    return {
      success: false,
      error: 'Email adapter not implemented yet'
    };
  }

  /**
   * Formata um template de notificação substituindo variáveis pelos valores
   * @param template Template com variáveis no formato {{variavel}}
   * @param data Objeto com os valores das variáveis
   * @returns Template formatado
   */
  private formatTemplate(template: string, data: any): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const keys = key.trim().split('.');
      let value = data;
      
      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) break;
      }
      
      return value !== undefined ? String(value) : match;
    });
  }
}

export default NotificationService;
