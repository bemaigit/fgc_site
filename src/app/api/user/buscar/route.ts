import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para continuar.' },
        { status: 401 }
      );
    }

    // Verificar permissões (apenas SUPER_ADMIN ou FEDERATION podem buscar usuários)
    if (!['SUPER_ADMIN', 'FEDERATION'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Permissão negada. Somente administradores podem buscar usuários.' },
        { status: 403 }
      );
    }

    // Obter o email da URL
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email não fornecido.' },
        { status: 400 }
      );
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isManager: true,
        managedClubId: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Usuário não encontrado.', user: null },
        { status: 200 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação.' },
      { status: 500 }
    );
  }
}
