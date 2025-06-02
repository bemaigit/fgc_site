import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import { generateProtocol } from '@/utils/protocol'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id
    const data = await request.json()
    const registrationId = uuidv4()
    const protocol = generateProtocol()

    // Buscar evento para confirmar que é gratuito
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        EventPricingTier: true
      }
    })

    if (!event) {
      return NextResponse.json({ message: 'Evento não encontrado' }, { status: 404 })
    }

    // Verificar se o evento é realmente gratuito
    let tier = null
    if (data.tierId && data.tierId !== 'free') {
      tier = await prisma.eventPricingTier.findUnique({
        where: { id: data.tierId }
      })
    }

    // Apenas processa se for realmente gratuito 
    // (pelo campo isFree do evento ou pelo preço do lote = 0)
    const isEventFree = event.isFree === true
    const isTierFree = tier ? parseFloat(tier.price.toString()) === 0 : false
    const isFree = isEventFree || isTierFree || data.tierId === 'free'

    if (!isFree) {
      return NextResponse.json({ 
        message: 'Esta API é apenas para eventos gratuitos', 
        suggestion: 'Use a API de registro temporário para eventos pagos' 
      }, { status: 400 })
    }

    console.log('Processando inscrição gratuita para o evento:', eventId)
    console.log('Dados recebidos:', data)
    console.log('É gratuito (evento.isFree):', isEventFree)
    console.log('É gratuito (preço zero):', isTierFree)
    
    // Gerar uma senha aleatória para o usuário anônimo (requisito do modelo Prisma)
    const randomPassword = uuidv4()
    
    // Primeiro criar ou buscar o usuário anônimo
    const anonymousUser = await prisma.user.upsert({
      where: { email: data.email },
      update: {
        name: data.name
      },
      create: {
        id: uuidv4(),
        email: data.email,
        name: data.name,
        password: randomPassword,
        role: 'USER'
      }
    })

    // Garantir que temos os dados de endereço no formato correto
    const addressData = data.address ? JSON.stringify(data.address) : '{}'

    // Verificar se o usuário já possui uma inscrição para este evento na mesma modalidade e categoria
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        eventId: eventId,
        userId: anonymousUser.id,
        modalityid: data.modalityId,
        categoryid: data.categoryId,
        // Não considerar inscrições canceladas/rejeitadas
        status: {
          notIn: ['CANCELED', 'REJECTED']
        }
      }
    });

    if (existingRegistration) {
      return NextResponse.json({
        message: 'Você já possui uma inscrição nesta modalidade e categoria para este evento.',
        existingRegistration: {
          id: existingRegistration.id,
          protocol: existingRegistration.protocol,
          status: existingRegistration.status
        }
      }, { status: 400 });
    }

    // Criar uma inscrição confirmada diretamente (já que é gratuito)
    const registration = await prisma.registration.create({
      data: {
        id: registrationId,
        eventId: eventId,
        userId: anonymousUser.id,
        status: 'CONFIRMED',
        protocol: protocol,
        modalityid: data.modalityId,
        categoryid: data.categoryId,
        tierid: data.tierId === 'free' ? null : data.tierId,
        name: anonymousUser.name,
        email: anonymousUser.email,
        cpf: data.cpf || '',
        birthdate: data.birthDate ? new Date(data.birthDate) : null,
        phone: data.phone || '',
        addressdata: JSON.stringify(data.address || {}),
        genderid: data.genderId || null,
        updatedAt: new Date()
      }
    })

    // Buscar detalhes adicionais para o email
    const eventDetails = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        title: true,
        location: true,
        description: true,
        startDate: true,
        endDate: true
      }
    });

    let modalityName = '';
    let categoryName = '';

    // Obter nome da modalidade se disponível
    if (data.modalityId) {
      const modality = await prisma.eventModality.findUnique({
        where: { id: data.modalityId }
      });
      modalityName = modality?.name || '';
    }

    // Obter nome da categoria se disponível
    if (data.categoryId) {
      const category = await prisma.eventCategory.findUnique({
        where: { id: data.categoryId }
      });
      categoryName = category?.name || '';
    }

    // Enviar email de confirmação
    try {
      const { EmailProvider } = require('@/lib/notifications/providers/email');
      const emailProvider = new EmailProvider();
      
      // Formatar data e hora do evento
      const startDate = eventDetails?.startDate ? new Date(eventDetails.startDate) : new Date();
      const formattedDate = startDate.toLocaleDateString('pt-BR');
      const formattedTime = startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      // Preparar dados para o template
      const notificationData = {
        type: 'event-registration',
        recipient: {
          name: anonymousUser.name,
          email: anonymousUser.email
        },
        data: {
          name: anonymousUser.name,
          eventName: eventDetails?.title || 'Evento',
          eventDate: formattedDate,
          eventTime: formattedTime,
          eventLocation: eventDetails?.location || '',
          protocol: protocol,
          status: 'Confirmada',
          modalityName,
          categoryName,
          logoUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/images/logo.png`,
          eventURL: `${process.env.NEXT_PUBLIC_BASE_URL}/eventos/${eventId}`
        }
      };
      
      const emailResult = await emailProvider.send(notificationData);
      console.log('Email de confirmação enviado:', emailResult.success);
    } catch (emailError) {
      console.error('Erro ao enviar email de confirmação:', emailError);
      // Continuar mesmo se o envio de email falhar
    }

    return NextResponse.json({
      message: 'Inscrição confirmada',
      success: true, 
      protocol,
      registrationId,
      isFree: true,
      price: 0
    })
  } catch (error) {
    console.error('Erro ao processar a inscrição gratuita:', error)
    return NextResponse.json({ 
      message: 'Erro ao processar a inscrição gratuita', 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}
