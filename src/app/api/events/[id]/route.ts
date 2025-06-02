import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Prisma } from '@prisma/client'
import crypto from 'crypto';

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Remover verificação de autenticação para permitir acesso público aos detalhes do evento
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json(
    //     { error: 'Não autorizado' },
    //     { status: 401 }
    //   )
    // }

    // Corrigir a extração do ID da rota dinâmica usando a abordagem assíncrona
    // Usar versão assíncrona para parâmetros de rota (Next.js 14+)
    const paramsAsync = await context.params;
    const id = paramsAsync.id;
    console.log(`Buscando evento com ID: ${id}`)

    // Melhorar a consulta para incluir detalhes completos das relações
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        EventToModality: {
          include: {
            EventModality: true
          }
        },
        EventToCategory: {
          include: {
            EventCategory: true
          }
        },
        EventToGender: {
          include: {
            Gender: true
          }
        },
        Country: true,
        State: true,
        City: true,
        EventPricingTier: {
          orderBy: {
            startDate: 'asc'
          }
        },
      }
    })

    if (!event) {
      console.error(`Evento não encontrado: ${id}`)
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }

    // Verificar e logar informações sobre as relações
    console.log('Verificação de relações no evento:')
    console.log(`- EventToModality: ${event.EventToModality.length}`)
    console.log(`- EventToCategory: ${event.EventToCategory.length}`)
    console.log(`- EventToGender: ${event.EventToGender.length}`)

    console.log(`Evento encontrado: ${event.title}`)
    console.log(`Modalidades: ${event.EventToModality.length}`)
    console.log(`Categorias: ${event.EventToCategory.length}`)
    console.log(`Gêneros: ${event.EventToGender.length}`)

    // Extrair informações das relações para facilitar o uso no frontend
    const modalities = event.EventToModality.map(relation => relation.EventModality)
    const categories = event.EventToCategory.map(relation => relation.EventCategory)
    const genders = event.EventToGender.map(relation => relation.Gender)

    // Formatar a resposta final mantendo TODAS as propriedades originais
    const eventResponse = {
      ...event,
      modalities,
      categories,
      genders
      // NÃO remover as relações originais para não quebrar a interface
    }

    return NextResponse.json(eventResponse);
  } catch (error) {
    console.error('Erro ao buscar evento:', error instanceof Error ? error.message : 'Erro desconhecido')
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Para acessar o ID do evento da URL usando a abordagem assíncrona
    const paramsAsync = await context.params;
    const id = paramsAsync.id;
    console.log(`Tentando atualizar evento com ID: ${id}`)

    // Obter dados enviados pelo cliente
    const data = await request.json()
    console.log('Dados recebidos para atualização:', data)

    // Verificar se o evento existe
    const eventExists = await prisma.event.findUnique({
      where: { id },
      select: { id: true }
    })

    if (!eventExists) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }

    // Atualizações para relações many-to-many
    const modalityUpdates = data.modalities || []
    const categoryUpdates = data.categories || []
    const genderUpdates = data.genders || []
    const tierUpdates = data.pricingTiers || []

    // Processar atualizações de lotes de preço
    const processTiers = async () => {
      if (!tierUpdates.length) return;

      // Excluir lotes existentes
      await prisma.eventPricingTier.deleteMany({
        where: { eventId: id }
      })

      // Criar novos lotes
      await Promise.all(tierUpdates.map(async (tier) => {
        // Gerar ID temporário se não existir
        if (!tier.id) {
          tier.id = `temp-${Date.now()}`;
        }

        return prisma.eventPricingTier.create({
          data: {
            id: tier.id,
            name: tier.name,
            description: tier.description || '',
            price: tier.price,
            startDate: new Date(tier.startDate),
            endDate: new Date(tier.endDate),
            endTime: tier.endTime || '23:59:59',
            maxEntries: tier.maxEntries || null,
            active: tier.active !== undefined ? tier.active : true,
            eventId: id
          }
        });
      }));
    }

    // Usar transação para garantir todas as atualizações
    await prisma.$transaction(async (tx) => {
      // 1. Atualizar informações básicas do evento
      await tx.event.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          location: data.location,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          published: data.published !== undefined ? data.published : false,
          coverImage: data.coverImage,
          posterImage: data.posterImage,
          maxParticipants: data.maxParticipants,
          isFree: data.isFree !== undefined ? data.isFree : false,
          registrationEnd: data.registrationEnd ? new Date(data.registrationEnd) : null,
          status: data.status || 'DRAFT',
          regulationPdf: data.regulationPdf,
          countryId: data.countryId,
          stateId: data.stateId,
          cityId: data.cityId,
          addressDetails: data.addressDetails,
          zipCode: data.zipCode,
          latitude: data.latitude,
          longitude: data.longitude,
          slug: data.slug,
          locationUrl: data.locationUrl,
          resultsFile: data.resultsFile
        }
      })

      // 2. Atualizar modalidades - excluir todas e recriar
      await tx.eventToModality.deleteMany({
        where: { eventId: id }
      })

      if (modalityUpdates.length) {
        await Promise.all(modalityUpdates.map(modalityId => 
          tx.eventToModality.create({
            data: {
              eventId: id,
              modalityId
            }
          })
        ))
      }

      // 3. Atualizar categorias - excluir todas e recriar
      await tx.eventToCategory.deleteMany({
        where: { eventId: id }
      })

      if (categoryUpdates.length) {
        await Promise.all(categoryUpdates.map(categoryId => 
          tx.eventToCategory.create({
            data: {
              eventId: id,
              categoryId
            }
          })
        ))
      }

      // 4. Atualizar gêneros - excluir todos e recriar
      await tx.eventToGender.deleteMany({
        where: { eventId: id }
      })

      if (genderUpdates.length) {
        await Promise.all(genderUpdates.map(genderId => 
          tx.eventToGender.create({
            data: {
              eventId: id,
              genderId
            }
          })
        ))
      }
    })

    // Processar lotes de preço separadamente devido a restrições de transação
    await processTiers()

    return NextResponse.json({
      success: true,
      message: 'Evento atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar evento:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Para acessar o ID do evento da URL usando a abordagem assíncrona
    const paramsAsync = await context.params;
    const id = paramsAsync.id;
    console.log(`Tentando publicar evento com ID: ${id}`)

    // Verificar se o evento existe
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        EventToModality: true,
        EventToCategory: true,
        EventToGender: true,
        EventPricingTier: true
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o evento já está publicado
    if (event.published) {
      return NextResponse.json(
        { error: 'Evento já está publicado' },
        { status: 400 }
      )
    }

    // Verificar se o evento tem as relações necessárias
    if (!event.EventToModality.length || !event.EventToCategory.length || !event.EventToGender.length) {
      return NextResponse.json(
        { error: 'Evento não pode ser publicado sem modalidade, categoria e gênero' },
        { status: 400 }
      )
    }

    // Verificar se o evento tem pelo menos um lote de preço (exceto se for gratuito)
    if (!event.isFree && !event.EventPricingTier.length) {
      return NextResponse.json(
        { error: 'Evento pago não pode ser publicado sem lotes de preço' },
        { status: 400 }
      )
    }

    // Publicar o evento
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        published: true,
        publishedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Evento publicado com sucesso',
      event: updatedEvent
    })
  } catch (error) {
    console.error('Erro ao publicar evento:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Para acessar o ID do evento da URL usando a abordagem assíncrona
    const paramsAsync = await context.params;
    const id = paramsAsync.id;
    console.log(`Tentando excluir evento com ID: ${id}`)

    // Verificar se o evento existe
    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }

    // Excluir primeiro as relações e depois o evento
    await prisma.$transaction([
      // 1. Excluir relações com modalidades
      prisma.eventToModality.deleteMany({
        where: { eventId: id }
      }),
      
      // 2. Excluir relações com categorias
      prisma.eventToCategory.deleteMany({
        where: { eventId: id }
      }),
      
      // 3. Excluir relações com gêneros
      prisma.eventToGender.deleteMany({
        where: { eventId: id }
      }),
      
      // 4. Excluir lotes de preço
      prisma.eventPricingTier.deleteMany({
        where: { eventId: id }
      }),

      // 5. Excluir inscrições (se houver)
      prisma.registration.deleteMany({
        where: { eventId: id }
      }),
      
      // 6. Excluir o evento
      prisma.event.delete({
        where: { id }
      })
    ])

    return NextResponse.json({
      success: true,
      message: 'Evento excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir evento:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
