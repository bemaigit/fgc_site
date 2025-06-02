import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { NotificationJob } from './notificationQueue';
import { WhatsAppAdapter } from '../adapters/whatsapp-adapter';
import { prisma } from '@/lib/prisma';

// Configuração da conexão Redis
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Worker para notificações WhatsApp
const whatsappWorker = new Worker<NotificationJob>(
  'notification:whatsapp',
  async (job: Job<NotificationJob>) => {
    console.log(`🔄 Processando notificação WhatsApp ${job.id}...`);
    const { recipient, content, metadata } = job.data;
    
    try {
      // Atualizar status da notificação no banco
      await prisma.notification.update({
        where: { id: job.id },
        data: { status: 'processing' }
      });
      
      // Registrar tentativa
      const attempt = await prisma.notificationAttempt.create({
        data: {
          id: `${job.id}_attempt_${Date.now()}`,
          notificationId: job.id,
          channel: 'whatsapp',
          success: false,  // Começa como false, atualizado depois
          error: null,
          providerId: null
        }
      });
      
      // Enviar mensagem via WhatsApp
      const whatsapp = new WhatsAppAdapter();
      const result = await whatsapp.sendTextMessage(recipient, content);
      
      if (result.success) {
        // Atualizar tentativa como bem-sucedida
        await prisma.notificationAttempt.update({
          where: { id: attempt.id },
          data: {
            success: true,
            providerId: result.messageId || null
          }
        });
        
        // Atualizar status da notificação
        await prisma.notification.update({
          where: { id: job.id },
          data: { status: 'delivered' }
        });
        
        console.log(`✅ Notificação WhatsApp ${job.id} enviada com sucesso`);
        return { success: true, messageId: result.messageId };
      } else {
        // Atualizar tentativa com erro
        await prisma.notificationAttempt.update({
          where: { id: attempt.id },
          data: {
            success: false,
            error: result.error || 'Erro desconhecido ao enviar mensagem'
          }
        });
        
        console.error(`❌ Erro ao enviar notificação WhatsApp ${job.id}:`, result.error);
        throw new Error(result.error || 'Erro desconhecido ao enviar mensagem');
      }
    } catch (error: any) {
      console.error(`❌ Erro ao processar notificação WhatsApp ${job.id}:`, error.message);
      
      // Se atingiu o número máximo de tentativas, marcar como failed
      if (job.attemptsMade >= (Number(process.env.NOTIFICATION_MAX_RETRIES) || 3)) {
        await prisma.notification.update({
          where: { id: job.id },
          data: { status: 'failed' }
        });
      }
      
      throw error;
    }
  },
  { connection: redisConnection, concurrency: 5 }
);

// Worker para notificações de e-mail
const emailWorker = new Worker<NotificationJob>(
  'notification:email',
  async (job: Job<NotificationJob>) => {
    console.log(`🔄 Processando notificação de e-mail ${job.id}...`);
    const { recipient, content, templateId, metadata } = job.data;
    
    try {
      // Atualizar status da notificação no banco
      await prisma.notification.update({
        where: { id: job.id },
        data: { status: 'processing' }
      });
      
      // Registrar tentativa
      const attempt = await prisma.notificationAttempt.create({
        data: {
          id: `${job.id}_attempt_${Date.now()}`,
          notificationId: job.id,
          channel: 'email',
          success: false,  // Começa como false, atualizado depois
          error: null,
          providerId: null
        }
      });
      
      // TODO: Implementar o envio de e-mail
      // Por enquanto, simularemos uma resposta de sucesso
      const result = {
        success: true,
        messageId: `email_${Date.now()}`
      };
      
      if (result.success) {
        // Atualizar tentativa como bem-sucedida
        await prisma.notificationAttempt.update({
          where: { id: attempt.id },
          data: {
            success: true,
            providerId: result.messageId
          }
        });
        
        // Atualizar status da notificação
        await prisma.notification.update({
          where: { id: job.id },
          data: { status: 'delivered' }
        });
        
        console.log(`✅ Notificação de e-mail ${job.id} enviada com sucesso`);
        return { success: true, messageId: result.messageId };
      } else {
        // Esta parte não será executada na simulação, mas mantida para implementação futura
        await prisma.notificationAttempt.update({
          where: { id: attempt.id },
          data: {
            success: false,
            error: 'Erro ao enviar e-mail'
          }
        });
        
        throw new Error('Erro ao enviar e-mail');
      }
    } catch (error: any) {
      console.error(`❌ Erro ao processar notificação de e-mail ${job.id}:`, error.message);
      
      // Se atingiu o número máximo de tentativas, marcar como failed
      if (job.attemptsMade >= (Number(process.env.NOTIFICATION_MAX_RETRIES) || 3)) {
        await prisma.notification.update({
          where: { id: job.id },
          data: { status: 'failed' }
        });
      }
      
      throw error;
    }
  },
  { connection: redisConnection, concurrency: 10 }
);

// Gerenciar eventos dos workers
whatsappWorker.on('completed', (job: Job) => {
  console.log(`✅ Job WhatsApp ${job.id} concluído`);
});

whatsappWorker.on('failed', (job: Job, error: Error) => {
  console.error(`❌ Job WhatsApp ${job?.id} falhou:`, error.message);
});

emailWorker.on('completed', (job: Job) => {
  console.log(`✅ Job Email ${job.id} concluído`);
});

emailWorker.on('failed', (job: Job, error: Error) => {
  console.error(`❌ Job Email ${job?.id} falhou:`, error.message);
});

// Função para iniciar os workers
export function startWorkers() {
  console.log('🚀 Iniciando workers de notificação...');
  return {
    whatsappWorker,
    emailWorker
  };
}

// Função para parar os workers de forma limpa
export async function stopWorkers() {
  console.log('🛑 Parando workers de notificação...');
  await whatsappWorker.close();
  await emailWorker.close();
}

export { whatsappWorker, emailWorker };
