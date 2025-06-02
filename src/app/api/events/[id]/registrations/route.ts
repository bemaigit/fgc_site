import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// Schema para validação de query params
const registrationQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).nullish().optional(),
  modalityId: z.string().nullish().optional(),
  categoryId: z.string().nullish().optional(),
  genderId: z.string().nullish().optional()
})

// GET - Listar inscrições de um evento
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Destructure id from params promise
  const { id } = await params;
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const searchParams = new URL(request.url).searchParams
    const queryParams = registrationQuerySchema.parse({
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      status: searchParams.get('status'),
      modalityId: searchParams.get('modalityId'),
      categoryId: searchParams.get('categoryId'),
      genderId: searchParams.get('genderId')
    })

    const skip = (queryParams.page - 1) * queryParams.limit

    // Construir where clause
    const where = {
      eventId: id,
      ...(queryParams.status ? { status: queryParams.status } : {}),
      ...(queryParams.modalityId ? { modalityid: queryParams.modalityId } : {}),
      ...(queryParams.categoryId ? { categoryid: queryParams.categoryId } : {}),
      ...(queryParams.genderId ? { genderid: queryParams.genderId } : {})
    }

    // Contar total de registros
    const total = await prisma.registration.count({ where })

    // Buscar inscrições
    const registrations = await prisma.registration.findMany({
      where,
      select: {
        id: true,
        protocol: true,
        status: true,
        createdAt: true,
        modalityid: true,
        categoryid: true,
        genderid: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            Athlete_Athlete_userIdToUser: {
              select: {
                id: true,
                fullName: true,
                cpf: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: queryParams.limit
    })

    // Buscar informações de modalidade, categoria e gênero
    const registrationsWithDetails = await Promise.all(
      registrations.map(async (registration) => {
        let modalityName = '';
        let categoryName = '';
        let genderName = '';

        if (registration.modalityid) {
          const modality = await prisma.eventModality.findUnique({
            where: { id: registration.modalityid }
          });
          modalityName = modality?.name || '';
        }

        if (registration.categoryid) {
          const category = await prisma.eventCategory.findUnique({
            where: { id: registration.categoryid }
          });
          categoryName = category?.name || '';
        }

        if (registration.genderid) {
          const gender = await prisma.gender.findUnique({
            where: { id: registration.genderid }
          });
          genderName = gender?.name || '';
        }

        return {
          ...registration,
          modalityName,
          categoryName,
          genderName
        };
      })
    );

    // Buscar opções de filtro
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
        }
      }
    });

    const filterOptions = {
      modalities: event?.EventToModality.map(etm => ({
        id: etm.EventModality.id,
        name: etm.EventModality.name
      })) || [],
      categories: event?.EventToCategory.map(etc => ({
        id: etc.EventCategory.id,
        name: etc.EventCategory.name
      })) || [],
      genders: event?.EventToGender.map(etg => ({
        id: etg.Gender.id,
        name: etg.Gender.name
      })) || []
    };

    return NextResponse.json({
      data: registrationsWithDetails,
      filterOptions,
      pagination: {
        page: queryParams.page,
        limit: queryParams.limit,
        total,
        totalPages: Math.ceil(total / queryParams.limit)
      }
    })

  } catch (error) {
    console.error('Erro ao listar inscrições:', error)
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar status de uma inscrição
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { registrationId, status } = body

    if (!registrationId || !status) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      )
    }

    // Verificar se a inscrição existe e pertence ao evento
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        id: registrationId,
        eventId: params.id
      }
    })

    if (!existingRegistration) {
      return NextResponse.json(
        { error: 'Inscrição não encontrada' },
        { status: 404 }
      )
    }

    // Atualizar status
    const updatedRegistration = await prisma.registration.update({
      where: { id: registrationId },
      data: { status }
    })

    return NextResponse.json(updatedRegistration)

  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    )
  }
}
