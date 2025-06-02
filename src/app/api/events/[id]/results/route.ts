import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'
import { WhatsAppAdapter } from '@/lib/notifications/adapters/whatsapp-adapter'
import { NotificationType } from '@/lib/notifications/types'

// Rota específica para atualizar apenas o campo resultsFile de um evento
export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Obter o ID do evento da URL (com await conforme exigido pelo Next.js)
    const { id } = await context.params
    console.log(`Atualizando resultsFile do evento com ID: ${id}`)

    // Obter o corpo da requisição
    const body = await request.json()
    console.log('Dados recebidos:', body)

    // Verificar se o campo resultsFile existe no corpo (pode ser null)
    if (body.resultsFile === undefined) {
      return NextResponse.json(
        { error: 'Campo resultsFile não encontrado no corpo da requisição' },
        { status: 400 }
      )
    }

    // Usar uma query SQL direta para atualizar o campo resultsFile
    // Isso evita problemas de tipagem com o Prisma
    console.log('Executando query SQL para atualizar resultsFile:', {
      id,
      resultsFile: body.resultsFile
    })
    
    // Tratar o caso de resultsFile === null explicitamente
    let result;
    if (body.resultsFile === null) {
      result = await prisma.$executeRaw`
        UPDATE "Event"
        SET "resultsFile" = NULL, "updatedAt" = NOW()
        WHERE "id" = ${id}
      `
    } else {
      result = await prisma.$executeRaw`
        UPDATE "Event"
        SET "resultsFile" = ${body.resultsFile}, "updatedAt" = NOW()
        WHERE "id" = ${id}
      `
    }

    console.log('Resultado da query SQL:', result)
    
    // Verificar se o campo foi atualizado corretamente
    const updatedEvent = await prisma.event.findUnique({
      where: { id }
    })
    
    console.log('Evento após atualização:', updatedEvent)

    console.log('Evento atualizado com sucesso:', result)

    // Enviar notificações WhatsApp para os participantes se resultsFile não for null
    if (body.resultsFile) {
      await sendResultsNotifications(id, updatedEvent?.title || 'Evento');
    }

    return NextResponse.json({
      success: true,
      message: 'URL do arquivo de resultados atualizada com sucesso',
      data: {
        id: id,
        resultsFile: body.resultsFile
      }
    })
  } catch (error) {
    console.error('Erro ao atualizar resultsFile do evento:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar URL do arquivo de resultados', details: (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * Função para enviar notificações WhatsApp aos participantes de um evento
 * quando os resultados são publicados
 */
async function sendResultsNotifications(eventId: string, eventTitle: string) {
  try {
    console.log(`Enviando notificações de resultados para o evento: ${eventId}`);
    
    // Buscar evento com todos os registros de participantes
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        Registration: {
          where: {
            status: { not: 'CANCELLED' } // Apenas inscrições ativas/confirmadas
          },
          include: {
            User: true
          }
        }
      }
    });

    if (!event || !event.Registration || event.Registration.length === 0) {
      console.log('Evento não encontrado ou sem participantes para notificar');
      return;
    }

    // Obter a URL base do site
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://fgciclismo.com.br';
    const resultsUrl = `${baseUrl}/eventos/${eventId}`;
    
    // Inicializar WhatsApp adapter
    const whatsappAdapter = new WhatsAppAdapter();
    const connectionStatus = await whatsappAdapter.checkConnectionStatus();
    
    if (connectionStatus.status !== 'connected') {
      console.error('Adaptador WhatsApp não está conectado');
      return;
    }

    // Formatar a data do evento
    const eventDate = event.startDate 
      ? new Date(event.startDate).toLocaleDateString('pt-BR') 
      : 'Data não especificada';

    // Contador de notificações enviadas
    let sentCount = 0;
    let failedCount = 0;

    // Para cada participante, enviar uma notificação
    for (const registration of event.Registration) {
      try {
        const { User } = registration;
        
        // Verificar se a inscrição tem número de telefone ou usar o telefone do usuário como fallback
        let phoneNumber = registration.phone;
        
        // Se não tiver telefone na inscrição, verificar o telefone do usuário
        if (!phoneNumber && User.phone) {
          phoneNumber = User.phone;
          console.log(`Usando telefone do usuário para ${User.name}: ${phoneNumber}`);
        }
        
        // Se ainda não tiver telefone, pular este participante
        if (!phoneNumber) {
          console.log(`Participante ${User.name} não tem número de telefone cadastrado`);
          continue;
        }

        // Formatar o número de telefone
        const formattedPhone = phoneNumber.replace(/\D/g, '');
        const phoneWithCountryCode = formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`; 

        // Mensagem personalizada
        const message = `*Resultados Publicados! 🏁*\n\nEvento: ${eventTitle}\nData: ${eventDate}\n\nOs resultados oficiais do evento já estão disponíveis para consulta.\n\nAcesse o link abaixo para visualizar:\n${resultsUrl}\n\nObrigado pela participação!\n\n*Federação Goiana de Ciclismo*`;

        // Enviar mensagem
        await whatsappAdapter.sendTextMessage(phoneWithCountryCode, message);
        console.log(`Notificação enviada para ${User.name} (${phoneWithCountryCode})`);

        // Registrar notificação no banco de dados
        await prisma.notification.create({
          data: {
            id: uuidv4(),
            type: NotificationType.EVENT_RESULTS_PUBLISHED,
            recipient: phoneWithCountryCode,
            channel: 'whatsapp',
            content: message,
            status: 'DELIVERED',
            priority: 'HIGH',
            metadata: {
              eventId,
              eventTitle,
              userId: User.id
            },
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        sentCount++;
      } catch (error) {
        console.error(`Erro ao enviar notificação para usuário ID ${registration.userId}:`, error);
        failedCount++;
      }
    }

    console.log(`Notificações de resultados enviadas: ${sentCount} enviadas, ${failedCount} falhas`);
  } catch (error) {
    console.error('Erro ao processar notificações de resultados:', error);
  }
}
