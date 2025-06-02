import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// Tipo para a resposta da API
interface RegulationResponse {
  data: {
    regulationPdf: string | null
  }
}

// GET: Buscar o regulamento de um evento
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id

    // Buscar o evento no banco de dados
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { regulationPdf: true }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }

    // Retornar os dados do regulamento
    return NextResponse.json({
      data: {
        regulationPdf: event.regulationPdf
      }
    } as RegulationResponse)
  } catch (error) {
    console.error('Erro ao buscar regulamento:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar regulamento do evento' },
      { status: 500 }
    )
  }
}

// PUT: Atualizar o regulamento de um evento
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const eventId = params.id
    const { regulationPdf } = await request.json()

    console.log('Atualizando regulamento do evento:', {
      eventId,
      regulationPdf
    })

    // Verificar se o evento existe
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar o regulamento do evento
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        regulationPdf,
        updatedAt: new Date()
      },
      select: {
        id: true,
        regulationPdf: true
      }
    })

    console.log('Regulamento atualizado com sucesso:', updatedEvent)

    // Retornar os dados atualizados
    return NextResponse.json({
      data: {
        regulationPdf: updatedEvent.regulationPdf
      }
    } as RegulationResponse)
  } catch (error) {
    console.error('Erro ao atualizar regulamento:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar regulamento do evento' },
      { status: 500 }
    )
  }
}
