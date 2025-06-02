import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const eventId = params.id;
    if (!eventId) {
      return NextResponse.json(
        { error: 'ID do evento não fornecido' },
        { status: 400 }
      );
    }

    // Buscar evento atual para obter o status atual
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { published: true }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }

    // Alternar o status de publicação (true para false ou false para true)
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { 
        published: !event.published 
      },
      select: {
        id: true,
        title: true,
        published: true
      }
    });

    return NextResponse.json({
      success: true,
      message: updatedEvent.published 
        ? `Evento "${updatedEvent.title}" publicado com sucesso` 
        : `Evento "${updatedEvent.title}" despublicado com sucesso`,
      event: updatedEvent
    });
  } catch (error) {
    console.error('Erro ao alternar status de publicação:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao processar a solicitação',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
