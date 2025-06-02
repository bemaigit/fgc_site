import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Extrair o ID do evento dos parâmetros de forma segura
    // Usar versão assíncrona para parâmetros de rota (Next.js 14+)
    const paramsAsync = await params;
    const eventId = paramsAsync.id;
    
    console.log(`[API] Buscando participantes para evento ID: ${eventId}`);
    
    const url = new URL(request.url)
    
    // Obter os parâmetros de consulta (filtros)
    const categoryId = url.searchParams.get('categoryId') || undefined
    const genderId = url.searchParams.get('genderId') || undefined
    const modalityId = url.searchParams.get('modalityId') || undefined

    // Construir o filtro de busca
    const filter: any = {
      eventId,
      // Apenas incluir os filtros se forem fornecidos
      ...(categoryId && { categoryid: categoryId }),
      ...(genderId && { genderid: genderId }),
      ...(modalityId && { modalityid: modalityId })
    }

    // Buscar as inscrições baseadas nos filtros
    const registrations = await prisma.registration.findMany({
      where: filter,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        Event: {
          select: {
            title: true
          }
        }
      }
    })

    // Buscar informações de modalidade, categoria e gênero para cada inscrição
    const participantsWithDetails = await Promise.all(
      registrations.map(async (registration) => {
        let modalityName = ''
        let categoryName = ''
        let genderName = ''

        if (registration.modalityid) {
          const modality = await prisma.eventModality.findUnique({
            where: { id: registration.modalityid }
          })
          modalityName = modality?.name || ''
        }

        if (registration.categoryid) {
          const category = await prisma.eventCategory.findUnique({
            where: { id: registration.categoryid }
          })
          categoryName = category?.name || ''
        }

        if (registration.genderid) {
          const gender = await prisma.gender.findUnique({
            where: { id: registration.genderid }
          })
          genderName = gender?.name || ''
        }

        return {
          id: registration.id,
          name: registration.name,
          email: registration.email,
          protocol: registration.protocol,
          createdAt: registration.createdAt,
          modalityName,
          categoryName,
          genderName
        }
      })
    )

    // Buscar todas as modalidades, categorias e gêneros do evento para os filtros
    const event = await prisma.event.findUnique({
      where: { id: eventId },
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
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { message: 'Evento não encontrado' },
        { status: 404 }
      )
    }

    // Extrair as opções de filtro
    const filterOptions = {
      modalities: event.EventToModality.map(etm => ({
        id: etm.EventModality.id,
        name: etm.EventModality.name
      })),
      categories: event.EventToCategory.map(etc => ({
        id: etc.EventCategory.id,
        name: etc.EventCategory.name
      })),
      genders: event.EventToGender.map(etg => ({
        id: etg.Gender.id,
        name: etg.Gender.name
      }))
    }

    return NextResponse.json({
      participants: participantsWithDetails,
      filterOptions,
      totalCount: participantsWithDetails.length,
      eventTitle: event.title
    })
  } catch (error) {
    console.error('Erro ao buscar participantes do evento:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar participantes do evento' },
      { status: 500 }
    )
  }
}
