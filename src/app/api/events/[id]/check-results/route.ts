import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Rota para verificar o valor atual do campo resultsFile de um evento
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Obter o ID do evento da URL
    const { id } = context.params
    console.log(`Verificando resultsFile do evento com ID: ${id}`)

    // Buscar o evento no banco de dados
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        resultsFile: true
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }

    console.log('Evento encontrado:', event)

    return NextResponse.json({
      success: true,
      data: event
    })
  } catch (error) {
    console.error('Erro ao verificar resultsFile do evento:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar URL do arquivo de resultados' },
      { status: 500 }
    )
  }
}
