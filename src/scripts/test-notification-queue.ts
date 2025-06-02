/**
 * Script para testar o sistema de filas de notificações
 * 
 * Execução:
 * npx ts-node -r tsconfig-paths/register src/scripts/test-notification-queue.ts
 */

import { notificationQueue } from '@/lib/notifications/queue/notification-queue';
import { INotificationPayload } from '@/lib/notifications/types';
import { v4 as uuidv4 } from 'uuid';

// Iniciar workers de teste
import startWorkers from '@/lib/notifications/queue/startWorkers';

async function testNotificationQueue() {
  console.log('🧪 Iniciando teste do sistema de filas de notificação');
  
  try {
    // Iniciar workers
    console.log('🚀 Iniciando workers de notificação');
    await startWorkers();
    
    // Criar uma notificação de teste
    const notificationId = uuidv4();
    const testPayload: INotificationPayload = {
      id: notificationId,
      type: 'TEST',
      recipient: '553199999999', // Substitua pelo número real para testar com WhatsApp
      channel: 'whatsapp',
      content: `Olá! Esta é uma mensagem de teste enviada às ${new Date().toLocaleTimeString()}.`,
      priority: 'normal',
      metadata: {
        testId: 'terminal-test',
        timestamp: Date.now()
      }
    };
    
    console.log(`📤 Enviando notificação de teste: ${notificationId}`);
    console.log('Payload:', JSON.stringify(testPayload, null, 2));
    
    // Adicionar à fila
    await notificationQueue.addToQueue(testPayload);
    
    // Aguardar um pouco para verificar o status
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Verificar status
    console.log('📊 Verificando status da notificação...');
    const status = await notificationQueue.getNotificationStatus(notificationId);
    console.log('Status:', JSON.stringify(status, null, 2));
    
    // Aguardar mais um pouco para processamento completo
    console.log('⏱️ Aguardando processamento da fila...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verificar status final
    const finalStatus = await notificationQueue.getNotificationStatus(notificationId);
    console.log('Status final:', JSON.stringify(finalStatus, null, 2));
    
    // Teste de notificação agendada
    console.log('📅 Testando notificação agendada...');
    const scheduledId = uuidv4();
    const scheduledTime = new Date(Date.now() + 30000); // 30 segundos no futuro
    
    const scheduledPayload: INotificationPayload = {
      id: scheduledId,
      type: 'SCHEDULED_TEST',
      recipient: '553199999999', // Substitua pelo número real para testar
      channel: 'whatsapp',
      content: `Esta é uma notificação AGENDADA para ${scheduledTime.toLocaleTimeString()}.`,
      priority: 'high',
      sendAt: scheduledTime.toISOString(),
      metadata: {
        testId: 'terminal-test-scheduled',
        timestamp: Date.now()
      }
    };
    
    console.log(`⏰ Agendando notificação: ${scheduledId} para ${scheduledTime.toLocaleTimeString()}`);
    await notificationQueue.addToQueue(scheduledPayload);
    
    console.log('✅ Teste concluído com sucesso!');
    console.log('Para testar a notificação agendada, mantenha o script rodando por 30 segundos.');
    console.log('Pressione Ctrl+C para encerrar o script.');
    
    // Manter o processo rodando para a notificação agendada ser processada
    await new Promise(resolve => setTimeout(resolve, 60000));
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    console.log('🛑 Finalizando teste...');
    // Tentar desligar a fila de forma limpa
    await notificationQueue.shutdown();
    process.exit(0);
  }
}

// Executar o teste
testNotificationQueue().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
