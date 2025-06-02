import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// PATCH /api/filiacao/clube/[id]/status - Atualiza o status de um clube
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação e permissões
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se o usuário é SUPER_ADMIN
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Permissão negada. Apenas SUPER_ADMIN pode alterar status de clubes' },
        { status: 403 }
      );
    }

    const clubId = params.id;
    const body = await request.json();
    
    // Validar corpo da requisição
    if (body.active === undefined) {
      return NextResponse.json(
        { error: 'O campo "active" é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o clube existe
    const club = await prisma.club.findUnique({
      where: { id: clubId }
    });

    if (!club) {
      return NextResponse.json(
        { error: 'Clube não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar o status do clube
    const updatedClub = await prisma.club.update({
      where: { id: clubId },
      data: { 
        active: body.active,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(updatedClub);
  } catch (error) {
    console.error('Erro ao atualizar status do clube:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status do clube' },
      { status: 500 }
    );
  }
}
