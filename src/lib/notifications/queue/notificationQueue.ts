import { Queue, Worker, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';
import { WhatsAppAdapter } from '../adapters/whatsapp-adapter';
import { prisma } from '@/lib/prisma';

// Tipos de dados para a fila
export interface NotificationJob {
  id: string;
  recipient: string;
  content: string;
  channel: 'whatsapp' | 'email' | 'sms';
  type: string;
  priority: 'low' | 'normal' | 'high';
  templateId?: string;
  metadata?: Record<string, any>;
}

// Configuração da conexão Redis
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Criar as filas de notificação - separadas por canal
export const whatsappQueue = new Queue<NotificationJob>('notification:whatsapp', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: Number(process.env.NOTIFICATION_MAX_RETRIES) || 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5 segundos iniciais
    },
    removeOnComplete: true,
    removeOnFail: 100, // Manter os últimos 100 trabalhos com falha para diagnóstico
  }
});

export const emailQueue = new Queue<NotificationJob>('notification:email', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: Number(process.env.NOTIFICATION_MAX_RETRIES) || 3,
    backoff: {
      type: 'exponential',
      delay: 10000, // 10 segundos iniciais
    },
    removeOnComplete: true,
    removeOnFail: 100,
  }
});

// Eventos da fila (para logging, métricas, etc.)
export const whatsappQueueEvents = new QueueEvents('notification:whatsapp', {
  connection: redisConnection
});

export const emailQueueEvents = new QueueEvents('notification:email', {
  connection: redisConnection
});

// Registrar eventos de fila para monitoramento
function setupQueueEvents() {
  whatsappQueueEvents.on('completed', async ({ jobId, returnvalue }) => {
    console.log(`✅ WhatsApp job ${jobId} concluído com sucesso:`, returnvalue);
  });

  whatsappQueueEvents.on('failed', async ({ jobId, failedReason }) => {
    console.error(`❌ WhatsApp job ${jobId} falhou:`, failedReason);
    
    // Atualizar status da notificação no banco de dados
    try {
      await prisma.notification.update({
        where: { id: jobId },
        data: { status: 'failed' }
      });
    } catch (error) {
      console.error('Erro ao atualizar status da notificação:', error);
    }
  });

  emailQueueEvents.on('completed', async ({ jobId, returnvalue }) => {
    console.log(`✅ Email job ${jobId} concluído com sucesso:`, returnvalue);
  });

  emailQueueEvents.on('failed', async ({ jobId, failedReason }) => {
    console.error(`❌ Email job ${jobId} falhou:`, failedReason);
    
    // Atualizar status da notificação no banco de dados
    try {
      await prisma.notification.update({
        where: { id: jobId },
        data: { status: 'failed' }
      });
    } catch (error) {
      console.error('Erro ao atualizar status da notificação:', error);
    }
  });
}

// Inicializar eventos da fila
setupQueueEvents();

// Exportar função para adicionar um trabalho na fila adequada
export async function queueNotification(notification: NotificationJob): Promise<string> {
  const { channel } = notification;
  
  // Selecionar a fila apropriada
  const queue = channel === 'email' ? emailQueue : whatsappQueue;
  
  // Adicionar trabalho na fila com o ID da notificação
  const job = await queue.add(notification.id, notification, {
    jobId: notification.id,
    priority: notification.priority === 'high' ? 1 : 
             notification.priority === 'normal' ? 5 : 10
  });
  
  console.log(`🔔 Notificação ${notification.id} adicionada à fila ${channel}`);
  return job.id;
}

// Exportar função para limpar todas as filas (útil para desenvolvimento/testes)
export async function clearQueues() {
  await whatsappQueue.obliterate();
  await emailQueue.obliterate();
  console.log('🧹 Todas as filas foram limpas');
}
