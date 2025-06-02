import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/athletes/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("API de atletas - Buscando atleta com ID:", params.id);
    
    // Buscar o atleta pelo ID incluindo o usuário relacionado
    const athlete = await prisma.athlete.findUnique({
      where: { id: params.id }
    });

    if (!athlete) {
      console.log("API de atletas - Atleta não encontrado");
      return NextResponse.json(
        { error: 'Atleta não encontrado' },
        { status: 404 }
      );
    }

    console.log("API de atletas - Atleta encontrado:", athlete.fullName);

    // Buscar informações do usuário
    let userImage = null;
    try {
      const user = await prisma.user.findUnique({
        where: { id: athlete.userId },
        select: {
          id: true,
          name: true,
          image: true
        }
      });
      userImage = user?.image;
    } catch (error) {
      console.error("API de atletas - Erro ao buscar usuário:", error);
    }

    // Buscar informações do clube
    let clubName = 'Individual';
    try {
      if (athlete.clubId) {
        const club = await prisma.club.findUnique({
          where: { id: athlete.clubId },
          select: {
            clubName: true
          }
        });
        clubName = club?.clubName || 'Individual';
      }
    } catch (error) {
      console.error("API de atletas - Erro ao buscar clube:", error);
    }

    // Buscar os nomes das modalidades baseado nos IDs armazenados
    let modalityNames: string[] = [];
    if (athlete.modalities && athlete.modalities.length > 0) {
      try {
        console.log("API de atletas - Buscando modalidades:", athlete.modalities);
        const modalities = await prisma.filiationModality.findMany({
          where: {
            id: {
              in: athlete.modalities
            }
          },
          select: {
            id: true,
            name: true
          }
        });
        modalityNames = modalities.map(m => m.name);
        console.log("API de atletas - Modalidades encontradas:", modalityNames);
      } catch (error) {
        console.error("API de atletas - Erro ao buscar modalidades:", error);
      }
    }

    // Buscar o nome da categoria
    let categoryName = '';
    if (athlete.category) {
      try {
        console.log("API de atletas - Buscando categoria:", athlete.category);
        const category = await prisma.filiationCategory.findUnique({
          where: {
            id: athlete.category
          },
          select: {
            name: true
          }
        });
        categoryName = category?.name || '';
        console.log("API de atletas - Categoria encontrada:", categoryName);
      } catch (error) {
        console.error("API de atletas - Erro ao buscar categoria:", error);
      }
    }

    // Formatar a resposta para incluir a imagem do usuário
    const formattedAthlete = {
      id: athlete.id,
      fullName: athlete.fullName,
      image: userImage,
      createdAt: athlete.createdAt,
      updatedAt: athlete.updatedAt,
      // Adicionar informações de modalidade, categoria e clube
      modalities: modalityNames,
      category: categoryName,
      clubName: clubName,
      // Manter os outros campos existentes
      email: athlete.email,
      cpf: athlete.cpf,
      phone: athlete.phone
    };

    console.log("API de atletas - Resposta formatada:", formattedAthlete);
    return NextResponse.json(formattedAthlete);
  } catch (error) {
    console.error('Erro ao buscar atleta:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar atleta' },
      { status: 500 }
    )
  }
}

// PUT /api/athletes/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const data = await request.json()
    
    // Atualiza o atleta
    const athlete = await prisma.athlete.update({
      where: { id: params.id },
      data
    })

    return NextResponse.json(athlete)
  } catch (error) {
    const errorObj = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : { message: 'Erro desconhecido' }

    console.error('Erro detalhado ao atualizar atleta:', errorObj)
    
    return NextResponse.json(
      { error: 'Erro ao atualizar atleta', details: errorObj },
      { status: 500 }
    )
  }
}

// DELETE /api/athletes/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Remove o atleta
    await prisma.athlete.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const errorObj = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : { message: 'Erro desconhecido' }

    console.error('Erro detalhado ao excluir atleta:', errorObj)
    
    return NextResponse.json(
      { error: 'Erro ao excluir atleta', details: errorObj },
      { status: 500 }
    )
  }
}
