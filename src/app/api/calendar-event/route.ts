import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Listar eventos do calendário
export async function GET(req: NextRequest) {
  try {
    const events = await prisma.calendarEvent.findMany({
      orderBy: { startdate: 'desc' }, // Mantendo a ordenação original para preservar a compatibilidade
    });
    // Corrigir serialização de BigInt
    const eventosSerializados = events.map(evento => ({
      ...evento,
      bannerTimestamp: evento.bannerTimestamp ? String(evento.bannerTimestamp) : null
    }));
    return NextResponse.json(eventosSerializados);
  } catch (err) {
    console.error('[API calendar-event] Erro ao listar eventos:', err);
    return NextResponse.json({ error: 'Erro ao listar eventos.', details: String(err) }, { status: 500 });
  }
}

// POST: Criar novo evento do calendário
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const event = await prisma.calendarEvent.create({ data });
    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao criar evento.' }, { status: 500 });
  }
}
