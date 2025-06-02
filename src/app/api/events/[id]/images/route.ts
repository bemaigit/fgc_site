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
const updateImagesSchema = z.object({
  coverImage: z.string().url().nullable().optional(),
  posterImage: z.string().url().nullable().optional()
})

export async function GET(
  _request: NextRequest,
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

    // Busca dados de imagens do evento
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        coverImage: true,
        posterImage: true
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: event })
  } catch (error) {
    console.error('Erro ao buscar imagens do evento:', error)
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
    const validationResult = updateImagesSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    // Atualiza as imagens do evento
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        coverImage: body.coverImage,
        posterImage: body.posterImage,
      },
      select: {
        id: true,
        coverImage: true,
        posterImage: true
      }
    })

    return NextResponse.json({ data: updatedEvent })
  } catch (error) {
    console.error('Erro ao atualizar imagens do evento:', error)

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
