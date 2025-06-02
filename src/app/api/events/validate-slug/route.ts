import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const slug = searchParams.get('slug')
    const currentEventId = searchParams.get('currentEventId')

    if (!slug) {
      return Response.json(
        { available: false, message: 'Slug é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar evento com o mesmo slug
    const existingEvent = await prisma.event.findFirst({
      where: {
        slug,
        // Excluir o evento atual da busca (caso seja uma edição)
        ...(currentEventId && { NOT: { id: currentEventId } })
      },
      select: { id: true }
    })

    return Response.json({
      available: !existingEvent,
      message: existingEvent 
        ? 'Esta URL personalizada já está em uso'
        : 'URL personalizada disponível'
    })
  } catch (error) {
    console.error('[validate-slug] Error:', error)
    return Response.json(
      { 
        available: false, 
        message: 'Erro ao validar URL personalizada'
      },
      { status: 500 }
    )
  }
}
