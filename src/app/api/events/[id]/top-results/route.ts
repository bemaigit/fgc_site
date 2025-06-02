import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validação para criação de resultados destacados
const createTopResultSchema = z.object({
  categoryId: z.string(),
  position: z.number().int().min(1).max(5),
  userId: z.string().optional().nullable(),
  athleteName: z.string(),
  clubId: z.string().optional().nullable(),
  clubName: z.string().optional().nullable(),
  result: z.string(),
});

// Schema de validação para atualização de resultados destacados
const updateTopResultSchema = z.object({
  id: z.string(),
  position: z.number().int().min(1).max(5).optional(),
  userId: z.string().optional().nullable(),
  athleteName: z.string().optional(),
  clubId: z.string().optional().nullable(),
  clubName: z.string().optional().nullable(),
  result: z.string().optional(),
});

// GET: Listar resultados destacados de um evento
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    
    // Verificar se o evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }
    
    // Buscar resultados destacados do evento
    const topResults = await prisma.eventTopResult.findMany({
      where: { eventId },
      orderBy: [
        { categoryId: 'asc' },
        { position: 'asc' },
      ],
      include: {
        EventCategory: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        Club: {
          select: {
            id: true,
            clubName: true,
          },
        },
      },
    });
    
    return NextResponse.json({ data: topResults });
  } catch (error) {
    console.error('Erro ao buscar resultados destacados:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar resultados destacados' },
      { status: 500 }
    );
  }
}

// POST: Adicionar resultados destacados a um evento
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const session = await getServerSession(authOptions);
    
    // Verificar autenticação
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Verificar se o evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }
    
    // Obter dados do corpo da requisição
    const body = await request.json();
    
    // Validar dados
    const validationResult = createTopResultSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { categoryId, position, userId, athleteName, clubId, clubName, result } = validationResult.data;
    
    // Verificar se a categoria existe
    const category = await prisma.eventCategory.findUnique({
      where: { id: categoryId },
    });
    
    if (!category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar se já existe um resultado para esta posição e categoria
    const existingResult = await prisma.eventTopResult.findFirst({
      where: {
        eventId,
        categoryId,
        position,
      },
    });
    
    if (existingResult) {
      return NextResponse.json(
        { error: 'Já existe um resultado para esta posição e categoria' },
        { status: 409 }
      );
    }
    
    // Criar resultado destacado
    const topResult = await prisma.eventTopResult.create({
      data: {
        id: crypto.randomUUID(),
        eventId,
        categoryId,
        position,
        userId,
        athleteName,
        clubId,
        clubName,
        result,
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({ data: topResult }, { status: 201 });
  } catch (error) {
    console.error('Erro ao adicionar resultado destacado:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar resultado destacado' },
      { status: 500 }
    );
  }
}

// PUT: Atualizar um resultado destacado
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const session = await getServerSession(authOptions);
    
    // Verificar autenticação
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Verificar se o evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }
    
    // Obter dados do corpo da requisição
    const body = await request.json();
    
    // Validar dados
    const validationResult = updateTopResultSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { id, position, userId, athleteName, clubId, clubName, result } = validationResult.data;
    
    // Verificar se o resultado existe e pertence ao evento
    const existingResult = await prisma.eventTopResult.findFirst({
      where: {
        id,
        eventId,
      },
    });
    
    if (!existingResult) {
      return NextResponse.json(
        { error: 'Resultado não encontrado ou não pertence a este evento' },
        { status: 404 }
      );
    }
    
    // Se a posição foi alterada, verificar se já existe um resultado para esta nova posição e categoria
    if (position && position !== existingResult.position) {
      const conflictingResult = await prisma.eventTopResult.findFirst({
        where: {
          eventId,
          categoryId: existingResult.categoryId,
          position,
          id: { not: id },
        },
      });
      
      if (conflictingResult) {
        return NextResponse.json(
          { error: 'Já existe um resultado para esta posição e categoria' },
          { status: 409 }
        );
      }
    }
    
    // Atualizar resultado destacado
    const updatedResult = await prisma.eventTopResult.update({
      where: { id },
      data: {
        position: position ?? undefined,
        userId,
        athleteName: athleteName ?? undefined,
        clubId,
        clubName,
        result: result ?? undefined,
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({ data: updatedResult });
  } catch (error) {
    console.error('Erro ao atualizar resultado destacado:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar resultado destacado' },
      { status: 500 }
    );
  }
}

// DELETE: Remover um resultado destacado
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const resultId = searchParams.get('resultId');
    
    // Verificar autenticação
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    if (!resultId) {
      return NextResponse.json(
        { error: 'ID do resultado não fornecido' },
        { status: 400 }
      );
    }
    
    // Verificar se o resultado existe e pertence ao evento
    const existingResult = await prisma.eventTopResult.findFirst({
      where: {
        id: resultId,
        eventId,
      },
    });
    
    if (!existingResult) {
      return NextResponse.json(
        { error: 'Resultado não encontrado ou não pertence a este evento' },
        { status: 404 }
      );
    }
    
    // Remover resultado destacado
    await prisma.eventTopResult.delete({
      where: { id: resultId },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover resultado destacado:', error);
    return NextResponse.json(
      { error: 'Erro ao remover resultado destacado' },
      { status: 500 }
    );
  }
}
