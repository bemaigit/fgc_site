import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

interface PrismaError {
  code?: string;
  message: string;
}

// Schema de validação para atualização
const updateModalitySchema = z.object({
  modalityId: z.string().min(1, 'Modalidade é obrigatória'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  genderId: z.string().min(1, 'Gênero é obrigatório')
})

export async function GET(
  _request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Removida verificação de autenticação para permitir visualização pública
    // conforme nova política de acesso aos eventos
    
    const { id } = context.params

    // Validação do ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID do evento inválido' },
        { status: 400 }
      )
    }

    // Busca dados de modalidade do evento
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        modalityId: true,
        categoryId: true,
        EventToGender: {
          select: {
            genderId: true
          },
          take: 1
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }

    const modalityData = {
      id: event.id,
      modalityId: event.modalityId || '',
      categoryId: event.categoryId || '',
      genderId: event.EventToGender[0]?.genderId || ''
    }

    return NextResponse.json({ data: modalityData })
  } catch (error) {
    console.error('Erro ao buscar modalidade do evento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = context.params

    // Validação do ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID do evento inválido' },
        { status: 400 }
      )
    }

    // Valida o corpo da requisição
    const body = await request.json()
    const validationResult = updateModalitySchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    const { modalityId, categoryId, genderId } = validationResult.data

    // Atualiza as relações em uma transação
    const updatedEvent = await prisma.$transaction(async (tx) => {
      // Atualiza modalidade e categoria
      const event = await tx.event.update({
        where: { id },
        data: {
          modalityId,
          categoryId,
          // Limpa relações existentes e cria nova
          EventToGender: {
            deleteMany: {},
            create: [{
              id: crypto.randomUUID(),
              genderId: genderId
            }]
          }
        },
        select: {
          id: true,
          modalityId: true,
          categoryId: true,
          EventToGender: {
            select: {
              genderId: true
            }
          }
        }
      })

      return {
        id: event.id,
        modalityId: event.modalityId || '',
        categoryId: event.categoryId || '',
        genderId: event.EventToGender[0]?.genderId || ''
      }
    })

    return NextResponse.json({ data: updatedEvent })
  } catch (error) {
    console.error('Erro ao atualizar modalidade do evento:', error)

    const prismaError = error as PrismaError
    if (prismaError.code === 'P2025') {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
