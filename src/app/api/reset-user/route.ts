import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Este endpoint é apenas para fins de teste e deve ser removido em produção
export async function POST(request: NextRequest) {
  try {
    // Verifica se estamos em desenvolvimento
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Endpoint disponível apenas em ambiente de desenvolvimento' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }
    
    // Usar o nome fornecido ou um nome padrão
    const userName = name || 'Usuário de Teste';

    // Verifica se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser) {
      // Atualiza o usuário existente
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          name: userName
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      });

      return NextResponse.json({
        message: 'Senha do usuário atualizada com sucesso',
        user: updatedUser
      });
    } else {
      // Cria um novo usuário
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: userName,
          role: 'USER'
        } as any, // Usar 'as any' para evitar problemas de tipagem,
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      });

      return NextResponse.json({
        message: 'Novo usuário criado com sucesso',
        user: newUser
      });
    }
  } catch (error) {
    console.error('Erro ao resetar usuário:', error);
    return NextResponse.json({ error: 'Erro ao processar a solicitação' }, { status: 500 });
  }
}
