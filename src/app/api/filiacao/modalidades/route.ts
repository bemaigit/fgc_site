import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import crypto from 'crypto';

export async function GET() {
  try {
    console.log('Iniciando busca de modalidades...')

    // Buscar todas as modalidades ativas
    console.log('Buscando modalidades ativas...')
    const modalidades = await prisma.filiationModality.findMany({
      where: { 
        active: true
      },
      select: {
        id: true,
        name: true,
        price: true,
      },
      orderBy: {
        order: 'asc'
      }
    })
    
    console.log('Modalidades encontradas:', modalidades)
    
    return NextResponse.json(modalidades)
  } catch (error: any) {
    console.error('Erro ao buscar modalidades:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar modalidades: ' + error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Gerar ID único para a modalidade
    const modalidade = await prisma.filiationModality.create({
      data: {
        id: crypto.randomUUID(),
        name: body.name,
        price: body.price,
        active: body.active || true,
        order: body.order || 0,
        createdBy: session.user?.id, // Usar opcional para evitar erros
        updatedBy: session.user?.id,
        updatedAt: new Date() // Adicionar timestamp de atualização
      }
    });
    
    return NextResponse.json(modalidade);
  } catch (error: any) {
    console.error('Erro ao criar modalidade:', error);
    return NextResponse.json(
      { error: 'Erro ao criar modalidade: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const modalidade = await prisma.filiationModality.update({
      where: { id: body.id },
      data: {
        name: body.name,
        price: body.price,
        active: body.active,
        order: body.order,
        updatedBy: session.user.id,
      }
    });
    
    return NextResponse.json(modalidade);
  } catch (error: any) {
    console.error('Erro ao atualizar modalidade:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar modalidade: ' + error.message },
      { status: 500 }
    );
  }
}
