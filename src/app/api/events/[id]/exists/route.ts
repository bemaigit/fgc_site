import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const eventId = params.id;
    if (!eventId) {
      return NextResponse.json({ error: 'ID do evento não fornecido' }, { status: 400 });
    }

    // Verificar se o evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true } // Selecionar apenas campos mínimos necessários
    });

    if (!event) {
      return NextResponse.json({ exists: false }, { status: 404 });
    }

    // Evento encontrado
    return NextResponse.json({ 
      exists: true,
      id: event.id,
      title: event.title
    });

  } catch (error) {
    console.error('Erro ao verificar existência do evento:', error);
    return NextResponse.json({ error: 'Erro ao verificar existência do evento' }, { status: 500 });
  }
}
