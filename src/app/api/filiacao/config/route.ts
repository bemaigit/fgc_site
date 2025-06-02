import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const config = await prisma.filiationConfig.findUnique({
      where: { id: 'default-filiation' },
    });
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const config = await prisma.filiationConfig.update({
      where: { id: 'default-filiation' },
      data: {
        ...data,
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações' },
      { status: 500 }
    );
  }
}
