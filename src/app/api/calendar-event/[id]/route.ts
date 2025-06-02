import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Buscar evento por ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const event = await prisma.calendarEvent.findUnique({ where: { id: params.id } });
    if (!event) return NextResponse.json({ error: 'Evento não encontrado.' }, { status: 404 });
    return NextResponse.json(event);
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao buscar evento.' }, { status: 500 });
  }
}

// PUT: Atualizar evento por ID
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const event = await prisma.calendarEvent.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(event);
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao atualizar evento.' }, { status: 500 });
  }
}

// DELETE: Remover evento por ID
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.calendarEvent.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao deletar evento.' }, { status: 500 });
  }
}
