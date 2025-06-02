import { prisma } from '@/lib/prisma';
import WhatsAppAdapter from './adapters/whatsapp-adapter';
import { randomUUID } from 'crypto';

/**
 * Script para testar o envio de notificações WhatsApp
 * 
 * Este script:
 * 1. Cria uma notificação no banco de dados
 * 2. Envia a mensagem usando o adaptador WhatsApp
 * 3. Registra a tentativa e atualiza o status
 */
async function testWhatsAppNotification() {
  try {
    console.log('Iniciando teste de notificação WhatsApp...');
    
    // Número de telefone para teste - ALTERE PARA SEU NÚMERO
    const phoneNumber = '556294242329'; // Número que você forneceu antes
    
    // Criar uma notificação no banco de dados
    const notificationId = randomUUID();
    const notification = await prisma.notification.create({
      data: {
        id: notificationId,
        type: 'test',
        recipient: phoneNumber,
        priority: 'normal',
        status: 'pending',
        updatedAt: new Date()
      }
    });
    
    console.log('Notificação criada com ID:', notificationId);
    
    // Enviar a mensagem usando o adaptador WhatsApp
    const whatsapp = new WhatsAppAdapter();
    const message = `🧪 Teste de notificação (ID: ${notificationId.substring(0, 8)})
    
Essa é uma mensagem de teste do sistema da Federação enviada em: ${new Date().toLocaleString()}

Respondendo essa mensagem você confirmará o recebimento.`;
    
    console.log('Enviando mensagem para:', phoneNumber);
    const result = await whatsapp.sendTextMessage(phoneNumber, message);
    console.log('Resultado do envio:', result);
    
    if (result.success) {
      // Registrar a tentativa bem-sucedida
      const attemptId = randomUUID();
      await prisma.notificationAttempt.create({
        data: {
          id: attemptId,
          notificationId,
          channel: 'whatsapp',
          success: true,
          providerId: result.messageId || '',
          createdAt: new Date()
        }
      });
      
      // Atualizar o status da notificação
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: 'sent',
          updatedAt: new Date()
        }
      });
      
      console.log('Tentativa registrada com sucesso:', attemptId);
      console.log('Notificação atualizada para status "sent"');
      
      // Registrar no log
      await prisma.notificationLog.create({
        data: {
          id: randomUUID(),
          type: 'whatsapp.test',
          recipient: phoneNumber,
          channel: 'whatsapp',
          status: 'sent',
          metadata: {
            notificationId,
            attemptId,
            messageId: result.messageId
          },
          updatedAt: new Date()
        }
      });
      
      console.log('✅ Teste de notificação concluído com sucesso!');
    } else {
      // Registrar a falha
      await prisma.notificationAttempt.create({
        data: {
          id: randomUUID(),
          notificationId,
          channel: 'whatsapp',
          success: false,
          error: result.error || 'Falha ao enviar mensagem',
          createdAt: new Date()
        }
      });
      
      // Atualizar o status da notificação
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: 'failed',
          updatedAt: new Date()
        }
      });
      
      console.log('❌ Erro ao enviar notificação:', result.error);
    }
  } catch (error) {
    console.error('Erro no teste de notificação:', error);
  } finally {
    // Fechar a conexão com o banco de dados
    await prisma.$disconnect();
  }
}

// Executar o teste
testWhatsAppNotification();
