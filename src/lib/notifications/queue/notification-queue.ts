/**
 * Serviço de Fila de Notificações usando Redis e BullMQ
 * 
 * Este serviço gerencia filas de notificações para processamento assíncrono
 * Importante: Requer os pacotes bullmq e @bull-board/api @bull-board/express instalados
 * npm install bullmq @bull-board/api @bull-board/express
 */

import { Queue, Worker, Job } from 'bullmq';
import { INotificationPayload } from '../types';
import { NotificationService } from '../notification-service';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';

// Constantes
const NOTIFICATION_QUEUE_NAME = 'notification-queue';
const MAX_RETRIES = parseInt(process.env.NOTIFICATION_MAX_RETRIES || '3', 10);
const DEFAULT_RETRY_DELAY = 60 * 1000; // 1 minuto

// Criar conexão Redis com configuração adequada para BullMQ
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

// Interfaces
interface NotificationJobData {
  notificationId: string;
  payload: INotificationPayload;
  attempt?: number;
  retryCount?: number;
}

// Interface para o resultado do processamento
interface NotificationProcessResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Serviço de Fila de Notificações
 */
export class NotificationQueueService {
  private queue: Queue<NotificationJobData>;
  private worker: Worker<NotificationJobData>;
  private notificationService: NotificationService;
  private isInitialized = false;

  constructor() {
    this.notificationService = new NotificationService();
    // Inicializar objetos para evitar undefined
    this.queue = new Queue(NOTIFICATION_QUEUE_NAME, {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false
      }
    });
    
    // Não inicializar o worker no construtor para evitar problemas no servidor Next.js
    // O worker será inicializado apenas quando initialize() for chamado
    this.worker = new Worker<NotificationJobData>(
      NOTIFICATION_QUEUE_NAME, 
      async () => ({}), 
      { connection: redisConnection }
    );
    this.worker.close(); // Fechar imediatamente para evitar execução prematura
  }

  /**
   * Inicializa a fila de notificações
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log(' Inicializando fila de notificações...');
      
      // Inicializar a fila (já foi inicializada no construtor)
      
      // Inicializar o worker para processar jobs
      this.worker = new Worker<NotificationJobData>(
        NOTIFICATION_QUEUE_NAME,
        async (job: Job<NotificationJobData>) => {
          return this.processJob(job);
        },
        {
          connection: redisConnection,
          concurrency: 5, // Processar até 5 notificações simultaneamente
          limiter: {
            max: 50,           // Máximo de 50 jobs
            duration: 60000,   // Por minuto
          },
        }
      );

      // Eventos do worker
      this.worker.on('completed', (job) => {
        console.log(` Notificação processada com sucesso: ${job.id}`);
      });

      this.worker.on('failed', (job, error) => {
        console.error(` Falha ao processar notificação ${job?.id}:`, error.message);
      });

      // Marcar como inicializado
      this.isInitialized = true;
      console.log(' Fila de notificações inicializada com sucesso!');
    } catch (error) {
      console.error(' Erro ao inicializar fila de notificações:', error);
      throw error;
    }
  }

  /**
   * Processa um job da fila
   */
  private async processJob(job: Job<NotificationJobData>): Promise<NotificationProcessResult> {
    const { notificationId, payload } = job.data;
    console.log(` Processando notificação ${notificationId} (tentativa ${job.attemptsMade + 1}/${MAX_RETRIES})`);

    try {
      // Atualizar status da notificação
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'processing' }
      });

      // Registrar tentativa
      const attemptId = `${notificationId}_attempt_${Date.now()}`;
      await prisma.notificationAttempt.create({
        data: {
          id: attemptId,
          notificationId,
          channel: payload.channel,
          success: false, // Começa como falso, será atualizado após o envio
          error: null,
          providerId: null
        }
      });

      // Processar notificação pelo canal apropriado
      await this.notificationService.processNotification(
        notificationId,
        payload.channel,
        payload.content,
        payload.metadata || {}
      );

      // Gerar um messageId se não for fornecido pelo adaptador
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

      // Atualizar a tentativa com o resultado
      await prisma.notificationAttempt.update({
        where: { id: attemptId },
        data: {
          success: true,
          providerId: messageId
        }
      });

      // Atualizar status da notificação
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'delivered' }
      });

      console.log(` Notificação ${notificationId} enviada com sucesso`);
      return {
        success: true,
        messageId
      };
    } catch (error: any) {
      console.error(` Falha ao processar notificação ${notificationId}:`, error.message);

      // Verificar se atingiu o máximo de tentativas
      if (job.attemptsMade >= MAX_RETRIES - 1) {
        await prisma.notification.update({
          where: { id: notificationId },
          data: { status: 'failed' }
        });
        console.error(` Notificação ${notificationId} falhou após ${MAX_RETRIES} tentativas`);
      }

      // Retornar erro formatado
      return {
        success: false,
        error: error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * Adiciona uma notificação à fila
   */
  async addToQueue(payload: INotificationPayload): Promise<string> {
    // Garantir que a fila está inicializada
    await this.initialize();

    try {
      // Gerar ID da notificação se não for fornecido
      const notificationId = payload.id || uuidv4();

      // Criar registro da notificação no banco
      const notification = await prisma.notification.create({
        data: {
          id: notificationId,
          type: payload.type || 'MANUAL',
          recipient: payload.recipient,
          priority: payload.priority || 'normal',
          status: 'pending',
          updatedAt: new Date()
        }
      });

      // Determinar prioridade do job
      let jobPriority = 5; // Normal por padrão
      if (payload.priority === 'high') jobPriority = 1;
      if (payload.priority === 'low') jobPriority = 10;

      // Preparar dados do job
      const jobData: NotificationJobData = {
        notificationId: notification.id,
        payload
      };

      // Verificar se é agendada
      if (payload.sendAt) {
        const sendAtDate = new Date(payload.sendAt);
        
        if (sendAtDate > new Date()) {
          // Adicionar job agendado
          await this.queue.add(
            `scheduled_${notification.id}`,
            jobData,
            {
              jobId: notification.id,
              priority: jobPriority,
              delay: sendAtDate.getTime() - Date.now()
            }
          );
          
          console.log(` Notificação ${notification.id} agendada para ${sendAtDate.toISOString()}`);
          return notification.id;
        }
      }

      // Adicionar à fila para processamento imediato
      await this.queue.add(
        `notification_${notification.id}`,
        jobData,
        {
          jobId: notification.id,
          priority: jobPriority
        }
      );

      console.log(` Notificação ${notification.id} adicionada à fila`);
      return notification.id;
    } catch (error) {
      console.error(' Erro ao adicionar notificação à fila:', error);
      throw error;
    }
  }

  /**
   * Cancela uma notificação pendente na fila
   */
  async cancelNotification(notificationId: string): Promise<boolean> {
    // Garantir que a fila está inicializada
    await this.initialize();

    try {
      // Verificar se a notificação existe e está pendente
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId }
      });

      if (!notification || notification.status !== 'pending') {
        return false;
      }

      // Remover da fila
      const job = await this.queue.getJob(notificationId);
      if (job) {
        await job.remove();
      }

      // Atualizar status
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: 'cancelled',
          updatedAt: new Date()
        }
      });

      console.log(` Notificação ${notificationId} cancelada`);
      return true;
    } catch (error) {
      console.error(` Erro ao cancelar notificação ${notificationId}:`, error);
      return false;
    }
  }

  /**
   * Verifica o status de uma notificação na fila
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
        return null;
      }

      // Obter informações do job, se existir
      let jobInfo = null;
      if (notification.status === 'pending') {
        const job = await this.queue.getJob(notificationId);
        if (job) {
          const state = await job.getState();
          jobInfo = {
            state,
            attemptsMade: job.attemptsMade
          };
        }
      }

      return {
        id: notification.id,
        status: notification.status,
        type: notification.type,
        recipient: notification.recipient,
        priority: notification.priority,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
        lastAttempt: notification.NotificationAttempt[0] || null,
        jobInfo
      };
    } catch (error) {
      console.error(` Erro ao obter status da notificação ${notificationId}:`, error);
      return null;
    }
  }

  /**
   * Para o worker e fecha as conexões
   */
  async shutdown() {
    if (!this.isInitialized) return;

    try {
      console.log(' Desligando fila de notificações...');
      
      // Parar o worker
      if (this.worker) {
        await this.worker.close();
      }
      
      // Fechar a fila
      if (this.queue) {
        await this.queue.close();
      }
      
      this.isInitialized = false;
      console.log(' Fila de notificações desligada com sucesso');
    } catch (error) {
      console.error(' Erro ao desligar fila de notificações:', error);
    }
  }
}

// Singleton para gerenciar fila de notificações
export const notificationQueue = new NotificationQueueService();
