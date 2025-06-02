import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateProtocol } from '@/lib/utils'
import crypto from 'crypto'
import NotificationService from '@/lib/notifications/notification-service'

// POST - Criar nova inscrição
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verifica se o evento existe e está publicado
    const eventId = await Promise.resolve(params.id);
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        Registration: true
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    if (!event.published) {
      return NextResponse.json(
        { error: 'Event is not published' },
        { status: 400 }
      )
    }

    // Verifica se as inscrições estão abertas
    const now = new Date()
    if (event.endDate && now > event.endDate) {
      return NextResponse.json(
        { error: 'Registration period has ended' },
        { status: 400 }
      )
    }

    // Verifica se o evento já passou
    if (event.startDate && now < event.startDate) {
      return NextResponse.json(
        { error: 'Event has not started yet' },
        { status: 400 }
      )
    }

    // Verifica se já existe uma inscrição para este usuário
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        eventId: eventId,
        userId: session.user.id
      }
    })

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'User is already registered' },
        { status: 400 }
      )
    }

    // Obter dados do formulário
    const formData = await request.json();
    
    // Cria a inscrição
    const registration = await prisma.registration.create({
      data: {
        id: crypto.randomUUID(),  // Adicionando o ID obrigatório
        eventId: eventId,
        userId: session.user.id,
        name: session.user.name || formData.name || 'Nome não fornecido',
        email: session.user.email || formData.email || 'email@example.com',
        phone: formData.phone || session.user.phone || null, // Usar o telefone do formulário ou do usuário
        status: 'PENDING',
        protocol: `EVE-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        updatedAt: new Date()  // Campo obrigatório
      }
    })
    
    // Buscar informações para enviar notificação
    try {
      // Buscar detalhes do usuário
      const user = await prisma.user.findUnique({
        where: { id: session.user.id }
      });
      
      // Buscar informações do atleta como fallback se não houver telefone na inscrição
      const athlete = await prisma.athlete.findUnique({
        where: { userId: session.user.id }
      });
      
      // Determinar o número de telefone a ser usado para a notificação
      // Priorizar: 1. Telefone da inscrição, 2. Telefone do usuário, 3. Telefone do atleta
      let recipientPhone = registration.phone || user?.phone || athlete?.phone;
      let recipientName = registration.name || user?.name || athlete?.fullName || 'Participante';
      
      console.log(`NOTIFICACAO DEBUG - Dados para notificação:`);
      console.log(`NOTIFICACAO DEBUG - Telefone da inscrição: ${registration.phone || 'Não informado'}`);
      console.log(`NOTIFICACAO DEBUG - Telefone do usuário: ${user?.phone || 'Não informado'}`);
      console.log(`NOTIFICACAO DEBUG - Telefone do atleta: ${athlete?.phone || 'Não informado'}`);
      console.log(`NOTIFICACAO DEBUG - Telefone escolhido: ${recipientPhone || 'Nenhum disponível'}`);
      
      // Encontrar detalhes do evento para a mensagem
      const eventDetails = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          title: true,
          startDate: true,
          location: true
        }
      });
      
      // Verificar se temos um telefone para enviar a notificação e se o evento foi encontrado
      if (recipientPhone && eventDetails) {
        const formattedDate = eventDetails.startDate
          ? new Date(eventDetails.startDate).toLocaleDateString('pt-BR')
          : 'Data a confirmar';
        
        // Enviar notificação de confirmação da inscrição
        const notificationService = new NotificationService();
        await notificationService.sendNotification({
          type: 'EVENT_REGISTRATION',
          recipient: recipientPhone,
          channel: 'whatsapp',
          content: `*Inscrição Confirmada!*\n\nOlá, ${recipientName}!\n\nSua inscrição no evento *${eventDetails.title}* foi recebida com sucesso.\n\n*Protocolo:* ${registration.protocol}\n*Data:* ${formattedDate}\n*Local:* ${eventDetails.location || 'A confirmar'}\n\nAcompanhe mais detalhes pelo site da FGC.\n\nAtenciosamente,\nFederação Goiana de Ciclismo`,
          priority: 'high',
          metadata: {
            eventId: eventId,
            eventName: eventDetails.title,
            registrationId: registration.id,
            protocol: registration.protocol,
            registrationDate: new Date().toISOString()
          }
        });
        console.log(`Notificação de inscrição enviada para ${recipientPhone}`);
      } else {
        console.log('Nenhum número de telefone disponível para notificação ou evento não encontrado');
      }
    } catch (notificationError) {
      // Não interromper o fluxo em caso de falha na notificação
      console.error('Erro ao enviar notificação de inscrição:', notificationError);
    }

    return NextResponse.json(registration)
  } catch (error) {
    console.error('Error registering for event:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// DELETE - Cancelar inscrição
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    // Verificar se a inscrição existe
    const eventId = await Promise.resolve(params.id);
    const registration = await prisma.registration.findFirst({
      where: {
        eventId: eventId,
        userId: session.user.id,
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      }
    })

    if (!registration) {
      return NextResponse.json(
        { error: 'Inscrição não encontrada' },
        { status: 404 }
      )
    }

    // Atualizar status para cancelado
    await prisma.registration.update({
      where: { id: registration.id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao cancelar inscrição:', error)
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    )
  }
}
