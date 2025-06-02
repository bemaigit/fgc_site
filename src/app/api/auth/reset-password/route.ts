import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as bcryptjs from 'bcryptjs'; // Usando bcryptjs em vez de bcrypt (mais compatível)

// Interface que representa a estrutura real da tabela PasswordReset
interface PasswordResetExtended {
  id: string;
  email: string;
  token: string;
  expires: Date; 
  createdAt: Date;
  userId?: string | null;
  updatedAt?: Date | null;
}

export async function POST(request: NextRequest) {
  try {
    // Parse do corpo da requisição com tratamento de erro
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Erro ao processar o corpo da requisição:', parseError);
      return NextResponse.json({ error: 'Formato de requisição inválido' }, { status: 400 });
    }

    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ error: 'Token e senha são obrigatórios' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 8 caracteres' }, { status: 400 });
    }

    console.log('Iniciando redefinição de senha para token:', token);

    try {
      // Buscar o registro de reset de senha pelo token usando SQL raw
      const result = await prisma.$queryRaw`
        SELECT "id", "email", "token", "expiresAt", "createdAt", "userId", "active", "updatedAt"
        FROM "PasswordReset"
        WHERE "token" = ${token}
        LIMIT 1
      `;

      // Verificar se o token foi encontrado
      const passwordReset = result?.[0];
      if (!passwordReset) {
        console.log('Token não encontrado no banco:', token);
        return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 });
      }
      
      // Extrair a data de expiração do resultado raw
      const expirationDate = passwordReset.expiresAt;
      
      // Verificar se o token não expirou
      if (!expirationDate || (passwordReset.active === false) || new Date(expirationDate) <= new Date()) {
        console.log('Token expirado ou inativo:', {
          token,
          expirationDate,
          active: passwordReset.active,
          currentDate: new Date()
        });
        return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 });
      }

      // Verificar se o userId existe
      if (!passwordReset.userId) {
        console.log('userId não encontrado para o token:', token);
        return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
      }

      // Gerar hash da nova senha usando bcryptjs (mesmo usado na autenticação)
      const hashedPassword = await bcryptjs.hash(password, 10);
      console.log('Senha hasheada com bcryptjs');

      // Atualizar a senha do usuário
      await prisma.user.update({
        where: { id: passwordReset.userId },
        data: { password: hashedPassword },
      });

      // Marcar o token como usado usando SQL raw
      await prisma.$executeRaw`
        UPDATE "PasswordReset" 
        SET "active" = FALSE, 
            "updatedAt" = ${new Date()}
        WHERE "id" = ${passwordReset.id}
      `;

      // Depois de redefinir a senha, excluímos o token para evitar reutilização
      await prisma.passwordReset.delete({
        where: { id: passwordReset.id },
      });

      console.log(`Senha redefinida com sucesso para o usuário: ${passwordReset.email}`);
      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.error('Erro ao atualizar senha:', dbError);
      return NextResponse.json({ error: 'Erro ao atualizar senha' }, { status: 500 });
    }
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
