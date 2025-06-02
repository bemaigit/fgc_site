import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/filiacao/clube/verificar?cnpj=00000000000000
// Ou GET /api/filiacao/clube/verificar para listar todos os clubes ativos
export async function GET(request: NextRequest) {
  try {
    // Obter o CNPJ da query
    const cnpj = request.nextUrl.searchParams.get('cnpj');
    
    // Se não for fornecido um CNPJ, retornar a lista de todos os clubes ativos
    if (!cnpj) {
      const clubs = await prisma.club.findMany({
        where: { active: true },
        select: {
          id: true,
          clubName: true,
          responsibleName: true
        },
        orderBy: { clubName: 'asc' }
      });
      
      return NextResponse.json(clubs);
    }

    // Formatar o CNPJ removendo caracteres não numéricos
    const formattedCnpj = cnpj.replace(/\D/g, '');
    
    // Buscar clube com o CNPJ informado
    const club = await prisma.club.findUnique({
      where: { cnpj: formattedCnpj },
      select: {
        id: true,
        clubName: true,
        responsibleName: true,
        active: true,
        paymentStatus: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!club) {
      return NextResponse.json({ exists: false });
    }

    // Retornar informações básicas do clube se ele existir
    return NextResponse.json({
      exists: true,
      club: {
        id: club.id,
        name: club.clubName,
        responsibleName: club.responsibleName,
        active: club.active,
        paymentStatus: club.paymentStatus,
        createdAt: club.createdAt,
        updatedAt: club.updatedAt
      }
    });
  } catch (error) {
    console.error('Erro ao verificar CNPJ:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar CNPJ' },
      { status: 500 }
    );
  }
}
