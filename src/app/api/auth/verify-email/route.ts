import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, message: 'Token não fornecido' }, { status: 400 });
    }

    console.log('Verificando token de email:', token);

    // Usar o prisma.$queryRaw com a estrutura atual da tabela EmailVerification
    // Consultar diretamente no banco de dados para evitar problemas de tipagem
    const result = await prisma.$queryRaw`
      SELECT "id", "userId", "token", "expiresAt", "createdAt", "updatedAt"
      FROM "EmailVerification"
      WHERE "token" = ${token}
    `;

    console.log('Resultado da busca:', result);

    // Verificar se encontrou algum registro
    const verification = Array.isArray(result) && result.length > 0 ? result[0] : null;
    if (!verification) {
      console.log('Token de verificação não encontrado:', token);
      return NextResponse.json({ 
        valid: false, 
        message: 'Token de verificação inválido ou expirado' 
      });
    }
    
    // Extrair a data de expiração do resultado raw
    const expirationDate = verification.expiresAt;
    
    // Verificar se o token não expirou
    if (!expirationDate || new Date(expirationDate) <= new Date()) {
      console.log('Token de verificação expirado:', {
        token,
        expirationDate,
        currentDate: new Date()
      });
      return NextResponse.json({ 
        valid: false, 
        message: 'Token de verificação expirado' 
      });
    }

    // Verificar se o userId existe
    if (!verification.userId) {
      console.log('userId não encontrado para o token:', token);
      return NextResponse.json({ 
        valid: false, 
        message: 'Token de verificação inválido' 
      });
    }

    try {
      // Marcar o email como verificado
      const updateResult = await prisma.user.update({
        where: { id: verification.userId },
        data: { emailVerified: new Date() },
      });

      console.log('Email verificado com sucesso para usuário:', updateResult.email);

      // Remover o token usado para evitar reutilização
      await prisma.$executeRaw`
        DELETE FROM "EmailVerification" 
        WHERE "token" = ${token}
      `;

      return NextResponse.json({ 
        valid: true, 
        message: 'Email verificado com sucesso' 
      });
    } catch (dbError) {
      console.error('Erro ao verificar email:', dbError);
      return NextResponse.json({ 
        valid: false, 
        message: 'Erro ao verificar email' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    return NextResponse.json({ 
      valid: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}
