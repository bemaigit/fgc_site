import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import { randomBytes } from 'crypto'
import { EmailProvider } from '@/lib/notifications/providers/email'
import NotificationService from '@/lib/notifications/notification-service'
import { NotificationType, NotificationChannel } from '@/lib/notifications/types'
import WhatsAppAdapter from '@/lib/notifications/adapters/whatsapp-adapter'

export async function POST(req: Request) {
  try {
    const { name, email, password, phone } = await req.json()

    // Validação básica
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Verifica se o email já está em uso
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Este email já está em uso' },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Cria o usuário com emailVerified como null (indicando não verificado)
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        name,
        email,
        password: hashedPassword,
        phone: phone || null, // Salvar o número de telefone no campo 'phone'
        role: 'USER', // Role padrão
        emailVerified: null // Indica que o email não foi verificado
      }
    })

    // Gerar token de verificação de email
    const verificationToken = randomBytes(32).toString('hex')
    const expiresDate = new Date()
    expiresDate.setHours(expiresDate.getHours() + 24) // Token válido por 24 horas

    // Armazenar o token no banco de dados usando a tabela EmailVerification
    try {
      // Verificar se já existe um token para este usuário
      const existingVerification = await prisma.$queryRaw`
        SELECT id FROM "EmailVerification" WHERE "userId" = ${user.id}
      `;

      if (Array.isArray(existingVerification) && existingVerification.length > 0) {
        // Se existir, atualizar o token
        await prisma.$executeRaw`
          UPDATE "EmailVerification" 
          SET "token" = ${verificationToken}, 
              "expiresAt" = ${expiresDate}, 
              "updatedAt" = ${new Date()}
          WHERE "userId" = ${user.id}
        `;
        console.log(`Token de verificação atualizado para: ${email}`);
      } else {
        // Se não existir, criar um novo registro
        await prisma.$executeRaw`
          INSERT INTO "EmailVerification" (
            "id", "userId", "token", "expiresAt", "createdAt", "updatedAt"
          )
          VALUES (
            ${uuidv4()}, ${user.id}, ${verificationToken}, ${expiresDate}, 
            ${new Date()}, ${new Date()}
          )
        `;
        console.log(`Novo token de verificação criado para: ${email}`);
      }
    } catch (dbError) {
      console.error('Erro ao criar token de verificação:', dbError);
      // Continuar mesmo se falhar, pois o usuário já foi criado
    }

    // Enviar email de verificação
    try {
      // Construir URL de verificação
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const verificationUrl = `${baseUrl}/auth/verify-email?token=${verificationToken}`

      // Criar provedor de email
      const emailProvider = new EmailProvider()

      // Preparar dados para a notificação
      const notificationData: any = {
        type: 'email-verification',
        recipient: { 
          name: user.name, 
          email: user.email 
        },
        data: {
          name: user.name,
          verificationUrl,
          logoUrl: `${baseUrl}/images/logo.png`,
        },
      }

      // Enviar email
      const result = await emailProvider.send(notificationData)

      if (!result.success) {
        console.error('Falha ao enviar email de verificação:', result.error)
      } else {
        console.log(`Email de verificação enviado para: ${email}`)
      }
    } catch (emailError) {
      console.error('Erro ao enviar email de verificação:', emailError)
      // Continuar mesmo se falhar, pois o usuário já foi criado
    }
    
    // Enviar mensagem de boas-vindas via WhatsApp (se o telefone foi fornecido)
    if (phone) {
      try {
        // URL base para o site (igual à usada no envio de email)
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        
        // Formatar o número de telefone (remover caracteres não numéricos e garantir formato 55DDNNNNNNNNN)
        const formattedPhone = phone.replace(/\D/g, '');
        const phoneWithCountryCode = formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`;
        
        // Criando a mensagem de boas-vindas com solicitação de autorização
        const welcomeMessage = `Olá, ${name}! 🚴‍♂️\n\nBem-vindo(a) à Federação Goiana de Ciclismo!\n\nAgora você pode se inscrever em eventos, acompanhar resultados e participar de nossa comunidade.\n\nAcesse seu perfil em: ${baseUrl}/perfil\n\nDúvidas? Estamos à disposição!\n\n*Autorização:* Para continuar recebendo notificações importantes sobre eventos, inscrições e resultados, responda SIM. Se preferir não receber, responda NÃO.`;
        
        // Usar o adaptador WhatsApp diretamente (contorna as verificações do serviço de notificações)
        const whatsappAdapter = new WhatsAppAdapter();
        
        // Verificar conexão com WhatsApp antes de enviar
        const connectionStatus = await whatsappAdapter.checkConnectionStatus();
        
        if (connectionStatus.status === 'connected') {
          try {
            // Enviar mensagem diretamente usando o adaptador
            const result = await whatsappAdapter.sendTextMessage(
              phoneWithCountryCode,
              welcomeMessage
            );
            
            if (result.success) {
              console.log(`Mensagem de boas-vindas WhatsApp enviada para: ${phoneWithCountryCode}`);
              
              // Registrar a notificação no banco de dados para fins de auditoria
              await prisma.notification.create({
                data: {
                  id: uuidv4(),
                  type: NotificationType.USER_WELCOME,
                  recipient: phoneWithCountryCode,
                  status: 'DELIVERED',
                  priority: 'HIGH',
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              });
            } else {
              console.error(`Falha ao enviar mensagem WhatsApp: ${result.error}`);
            }
          } catch (error) {
            console.error('Erro ao enviar WhatsApp:', error);
          }
        } else {
          console.warn(`WhatsApp não está conectado. Status: ${connectionStatus.status}`);
        }
      } catch (whatsappError) {
        console.error('Erro ao enviar mensagem de boas-vindas via WhatsApp:', whatsappError);
        // Continuar mesmo se falhar, pois o usuário já foi criado e o email foi enviado
      }
    }

    // Remove a senha do objeto retornado
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      { 
        ...userWithoutPassword, 
        message: 'Conta criada com sucesso! Verifique seu email para ativar sua conta.' 
      }, 
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao registrar usuário:', error)
    return NextResponse.json(
      { message: 'Erro ao criar conta' },
      { status: 500 }
    )
  }
}
