import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Endpoint para atualização de clube
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para continuar.' },
        { status: 401 }
      );
    }

    // Verificar permissões (apenas SUPER_ADMIN ou FEDERATION podem modificar clubes)
    if (!['SUPER_ADMIN', 'FEDERATION'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Permissão negada. Somente administradores podem modificar clubes.' },
        { status: 403 }
      );
    }

    const clubId = params.id;
    const body = await request.json();

    // Verificar se o clube existe
    const clubExists = await prisma.club.findUnique({
      where: { id: clubId }
    });

    if (!clubExists) {
      return NextResponse.json(
        { error: 'Clube não encontrado.' },
        { status: 404 }
      );
    }

    // Extrair campos para atualização
    const {
      clubName,
      responsibleName,
      email,
      phone,
      address,
      zipCode,
      city,
      state,
      assignManager,
      managerId
    } = body;

    // Atualizar clube
    const updatedClub = await prisma.club.update({
      where: { id: clubId },
      data: {
        clubName,
        responsibleName,
        email,
        phone,
        address,
        zipCode: zipCode.replace(/\D/g, ''),
        city,
        state
      }
    });

    // Se solicitado, designar usuário como dirigente
    if (assignManager && managerId) {
      // Verificar se este usuário já é dirigente de outro clube
      const currentManager = await prisma.user.findUnique({
        where: { id: managerId }
      });

      if (currentManager) {
        // Atualizar usuário como dirigente deste clube
        await prisma.user.update({
          where: { id: managerId },
          data: {
            isManager: true,
            managedClubId: clubId
          }
        });
      }
    }

    return NextResponse.json({
      message: 'Clube atualizado com sucesso.',
      club: updatedClub
    });
  } catch (error) {
    console.error('Erro ao atualizar clube:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação.' },
      { status: 500 }
    );
  }
}

// Endpoint para obter detalhes de um clube
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para continuar.' },
        { status: 401 }
      );
    }

    const clubId = params.id;

    // Buscar clube
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!club) {
      return NextResponse.json(
        { error: 'Clube não encontrado.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ club });
  } catch (error) {
    console.error('Erro ao buscar clube:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação.' },
      { status: 500 }
    );
  }
}
