import { NextRequest, NextResponse } from 'next/server';
import { EmailProvider } from '@/lib/notifications/providers/email';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';

// Interface que representa a estrutura real da tabela PasswordReset
interface PasswordResetExtended {
  id: string;
  email: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  userId?: string | null;
  updatedAt?: Date | null;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Se o usuário não existir, retornamos 200 mesmo assim por segurança
    // Isso evita enumeração de emails (descobrir quais emails estão cadastrados)
    if (!user) {
      console.log(`Tentativa de reset de senha para email não cadastrado: ${email}`);
      return NextResponse.json({ success: true });
    }

    // Gerar token único
    const token = randomBytes(32).toString('hex');
    const expiresDate = new Date();
    expiresDate.setMinutes(expiresDate.getMinutes() + 30); // Token válido por 30 minutos

    try {
      // Verificar se já existe um token para este email
      const existingResult = await prisma.$queryRaw`
        SELECT "id" FROM "PasswordReset" WHERE "email" = ${user.email!} LIMIT 1
      `;
      
      const existingReset = existingResult?.[0];

      if (existingReset) {
        // Atualizar o registro existente usando SQL raw
        await prisma.$executeRaw`
          UPDATE "PasswordReset" 
          SET "token" = ${token}, 
              "expiresAt" = ${expiresDate}, 
              "updatedAt" = ${new Date()},
              "active" = TRUE
          WHERE "id" = ${existingReset.id}
        `;
        
        console.log(`Token de reset atualizado para: ${email}, expira em: ${expiresDate}`);
      } else {
        // Criar um novo registro usando SQL raw
        const id = randomBytes(16).toString('hex');
        await prisma.$executeRaw`
          INSERT INTO "PasswordReset" (
            "id", "email", "token", "expiresAt", "userId", "createdAt", "updatedAt", "active"
          )
          VALUES (
            ${id}, ${user.email!}, ${token}, ${expiresDate}, ${user.id}, 
            ${new Date()}, ${new Date()}, TRUE
          )
        `;
        
        console.log(`Novo token de reset criado para: ${email}, expira em: ${expiresDate}`);
      }
    } catch (dbError) {
      console.error('Erro ao manipular o registro de reset de senha:', dbError);
      throw dbError; // Re-lançar o erro para ser tratado mais acima
    }

    // Construir URL de recuperação
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

    // Criar provedor de email
    const emailProvider = new EmailProvider();

    // Preparar dados para a notificação e usar asserção de tipo
    const notificationData: any = {
      type: 'password-reset',
      recipient: { 
        name: user.name || 'Usuário',
        email: user.email! 
      },
      data: {
        name: user.name || 'Usuário',
        resetUrl,
        logoUrl: `${baseUrl}/images/logo.png`,
      },
    };

    // Enviar email
    const result = await emailProvider.send(notificationData);

    if (!result.success) {
      console.error('Falha ao enviar email de recuperação:', result.error);
      return NextResponse.json(
        { error: 'Ocorreu um erro ao enviar o email de recuperação' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao processar solicitação de reset de senha:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
