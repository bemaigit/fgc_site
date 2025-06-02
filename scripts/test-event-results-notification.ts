import { prisma } from '../src/lib/prisma';
import { WhatsAppAdapter } from '../src/lib/notifications/adapters/whatsapp-adapter';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { NotificationType } from '../src/lib/notifications/types';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Script para testar o envio de notificações de resultados de eventos publicados
 */
async function testEventResultsNotification() {
  console.log('Iniciando teste de notificação de resultados de eventos...');

  try {
    // 1. Verifica se o WhatsApp está conectado
    const whatsappAdapter = new WhatsAppAdapter();
    const connectionStatus = await whatsappAdapter.checkConnectionStatus();
    
    console.log('Status da conexão WhatsApp:', connectionStatus);
    
    if (connectionStatus.status !== 'connected') {
      console.error('WhatsApp não está conectado. Verifique as configurações.');
      return;
    }

    // 2. Buscar um evento existente
    console.log('Buscando evento para teste...');
    const event = await prisma.event.findFirst({
      where: {
        published: true,
        // Garantir que tenha pelo menos uma inscrição
        Registration: {
          some: {}
        }
      },
      include: {
        Registration: {
          take: 1,
          include: {
            User: true
          }
        }
      }
    });

    if (!event) {
      console.error('Nenhum evento com inscrições encontrado para teste');
      return;
    }

    console.log(`Evento encontrado: ${event.title} (ID: ${event.id})`);
    console.log(`Tem ${event.Registration.length} inscrições`);

    // 3. Obter um usuário inscrito para enviar a notificação de teste
    const registration = event.Registration[0];
    const user = registration.User;

    // Verificar se a inscrição tem número de telefone
    let phoneNumber = registration.phone;
    
    // Se não tiver telefone na inscrição, verificar o telefone do usuário
    if (!phoneNumber && user.phone) {
      phoneNumber = user.phone;
      console.log(`Usando telefone do usuário para ${user.name}: ${phoneNumber}`);
    }
    
    // Se ainda não tiver telefone, tentar buscar do atleta como último recurso
    if (!phoneNumber) {
      const athlete = await prisma.athlete.findFirst({
        where: { userId: user.id }
      });
      
      if (athlete?.phone) {
        phoneNumber = athlete.phone;
        console.log(`Usando telefone do atleta para ${user.name}: ${phoneNumber}`);
      }
    }
    
    // Se não tiver telefone em nenhum lugar, não podemos enviar a notificação
    if (!phoneNumber) {
      console.error(`Não foi encontrado telefone para o participante ${user.name}`);
      return;
    }

    console.log(`Enviando notificação para: ${user.name} (${phoneNumber})`);

    // 4. Formatar número de telefone
    const formattedPhone = phoneNumber.replace(/\D/g, '');
    const phoneWithCountryCode = formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`;

    // 5. Preparar a mensagem
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://fgciclismo.com.br';
    const resultsUrl = `${baseUrl}/eventos/${event.id}`;
    
    const eventDate = event.startDate 
      ? new Date(event.startDate).toLocaleDateString('pt-BR') 
      : 'Data não especificada';

    const message = `*Resultados Publicados! 🏁*\n\nEvento: ${event.title}\nData: ${eventDate}\n\nOs resultados oficiais do evento já estão disponíveis para consulta.\n\nAcesse o link abaixo para visualizar:\n${resultsUrl}\n\nObrigado pela participação!\n\n*Federação Goiana de Ciclismo*`;

    // 6. Enviar mensagem
    console.log('Enviando mensagem WhatsApp...');
    const result = await whatsappAdapter.sendTextMessage(phoneWithCountryCode, message);
    console.log('Resultado do envio:', result);

    // 7. Registrar notificação no banco de dados
    await prisma.notification.create({
      data: {
        id: uuidv4(),
        type: NotificationType.EVENT_RESULTS_PUBLISHED,
        recipient: phoneWithCountryCode,
        status: 'DELIVERED',
        priority: 'HIGH',
        updatedAt: new Date(),
        // Registrar também a tentativa de notificação
        NotificationAttempt: {
          create: {
            id: uuidv4(),
            channel: 'WHATSAPP',
            success: true,
            createdAt: new Date()
          }
        }
      }
    });
    
    // Também registramos no log de notificações para mais detalhes
    await prisma.notificationLog.create({
      data: {
        id: uuidv4(),
        type: NotificationType.EVENT_RESULTS_PUBLISHED,
        recipient: phoneWithCountryCode,
        channel: 'WHATSAPP',
        status: 'DELIVERED',
        metadata: {
          eventId: event.id,
          eventTitle: event.title,
          userId: user.id,
          isTest: true,
          messageContent: message // Salvamos o conteúdo dentro do metadata
        },
        sentAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('Notificação de teste registrada no banco de dados');
    console.log('Teste concluído com sucesso!');

  } catch (error) {
    console.error('Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o teste
testEventResultsNotification()
  .then(() => {
    console.log('Script finalizado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro ao executar o script:', error);
    process.exit(1);
  });
