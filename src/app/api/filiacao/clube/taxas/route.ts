import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/filiacao/clube/taxas - Retorna as taxas para filiação de clubes
export async function GET() {
  try {
    // Buscar as taxas ativas
    const fees = await prisma.clubFeeSettings.findFirst({
      where: { active: true },
    });

    // Se não encontrar, retorna valores padrão
    if (!fees) {
      return NextResponse.json({
        id: 'default',
        newRegistrationFee: 200.00,
        annualRenewalFee: 150.00,
      });
    }

    return NextResponse.json(fees);
  } catch (error) {
    console.error('Erro ao buscar taxas de clubes:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar taxas de filiação de clubes' },
      { status: 500 }
    );
  }
}

// POST /api/filiacao/clube/taxas - Atualiza as taxas para filiação de clubes
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação e permissões
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se o usuário é admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validar os dados recebidos
    if (!body.newRegistrationFee || !body.annualRenewalFee) {
      return NextResponse.json(
        { error: 'Dados inválidos, ambas as taxas são obrigatórias' },
        { status: 400 }
      );
    }

    // Desativar todas as configurações ativas
    await prisma.clubFeeSettings.updateMany({
      where: { active: true },
      data: { active: false }
    });

    // Criar nova configuração
    const newFees = await prisma.clubFeeSettings.create({
      data: {
        newRegistrationFee: parseFloat(body.newRegistrationFee),
        annualRenewalFee: parseFloat(body.annualRenewalFee),
        active: true,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(newFees);
  } catch (error) {
    console.error('Erro ao atualizar taxas de clubes:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar taxas de filiação de clubes' },
      { status: 500 }
    );
  }
}
