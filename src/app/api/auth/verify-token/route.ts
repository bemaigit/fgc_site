import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Interface que representa a estrutura real da tabela PasswordReset
interface PasswordResetExtended {
  id: string;
  email: string;
  token: string;
  expiresAt: Date; 
  createdAt: Date;
  userId?: string | null;
  active?: boolean | null;
  updatedAt?: Date | null;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    // Usando SQL raw para ter acesso direto ao campo correto no banco de dados
    const result = await prisma.$queryRaw`
      SELECT "id", "email", "token", "expiresAt", "createdAt", "userId", "active", "updatedAt"
      FROM "PasswordReset"
      WHERE "token" = ${token}
      LIMIT 1
    `;

    // Verificar se o token foi encontrado
    const passwordReset = result?.[0];
    if (!passwordReset) {
      console.log('Token não encontrado:', token);
      return NextResponse.json({ valid: false });
    }

    // Extrair a data de expiração do resultado raw (usando o nome correto do campo no banco)
    const expirationDate = passwordReset.expiresAt;
    
    // Verificar se o token existe, está ativo e não expirou
    const isValid = 
      (passwordReset.active === undefined || passwordReset.active === true) && 
      expirationDate && new Date(expirationDate) > new Date();

    console.log('Verificação de token:', {
      token,
      expirationDate,
      currentDate: new Date(),
      isValid
    });

    return NextResponse.json({ valid: isValid });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return NextResponse.json({ valid: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
