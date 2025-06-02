import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// Schema de validação para atualização
const updateLocationSchema = z.object({
  countryId: z.string().min(1, 'País é obrigatório'),
  stateId: z.string().min(1, 'Estado é obrigatório'),
  cityId: z.string().min(1, 'Cidade é obrigatória'),
  addressDetails: z.string().min(5, 'Endereço deve ter no mínimo 5 caracteres'),
  zipCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional()
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

    // Busca dados de localização do evento
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        countryId: true,
        stateId: true,
        cityId: true,
        addressDetails: true,
        zipCode: true,
        latitude: true,
        longitude: true,
        country: true,
        state: true,
        city: true,
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
    console.error('Erro ao buscar localização do evento:', error)
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
    const validationResult = updateLocationSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    // Atualiza a localização do evento
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: validationResult.data,
      select: {
        id: true,
        countryId: true,
        stateId: true,
        cityId: true,
        addressDetails: true,
        zipCode: true,
        latitude: true,
        longitude: true,
        country: true,
        state: true,
        city: true,
      }
    })

    return NextResponse.json({ data: updatedEvent })
  } catch (error) {
    console.error('Erro ao atualizar localização do evento:', error)

    // Verifica se é erro do Prisma
    if ((error as any).code === 'P2025') {
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
