import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// POST /api/filiacao/clube - Cadastra um novo clube ou renova anuidade
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const isNewRegistration = body.isNewRegistration;
    
    // Validação básica dos dados
    if (isNewRegistration) {
      // Validar todos os campos para novo cadastro
      if (!body.responsibleName || !body.clubName || !body.cnpj || 
          !body.address || !body.city || !body.state || 
          !body.zipCode || !body.phone || !body.email) {
        return NextResponse.json(
          { error: 'Todos os campos são obrigatórios para novo cadastro' },
          { status: 400 }
        );
      }
    } else {
      // Validar apenas CNPJ para renovação
      if (!body.cnpj) {
        return NextResponse.json(
          { error: 'CNPJ é obrigatório para renovação' },
          { status: 400 }
        );
      }
    }

    // Formatar o CNPJ removendo caracteres não numéricos
    const formattedCnpj = body.cnpj.replace(/\D/g, '');

    // Verificar se é cadastro manual por admin
    const isManualRegistration = body.isManualRegistration === true && 
      (session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN');

    // Buscar as taxas - usar try-catch para lidar com modelo não disponível
    let fees = { newRegistrationFee: 200.00, annualRenewalFee: 150.00 };
    try {
      if (prisma.clubFeeSettings) {
        const feeSettings = await prisma.clubFeeSettings.findFirst({
          where: { active: true }
        });
        if (feeSettings) {
          fees = feeSettings;
        }
      }
    } catch (feeError) {
      console.error('Erro ao buscar taxas de clube:', feeError);
      // Continuar com os valores padrão
    }

    if (isNewRegistration) {
      // Verificar se já existe clube com este CNPJ
      const existingClub = await prisma.club.findUnique({
        where: { cnpj: formattedCnpj }
      });

      if (existingClub) {
        return NextResponse.json(
          { error: 'Já existe um clube cadastrado com este CNPJ' },
          { status: 400 }
        );
      }

      // Determinar status de pagamento
      const paymentStatus = isManualRegistration ? 'CONFIRMED' : 'PENDING';
      
      // Criar novo clube
      const newClub = await prisma.club.create({
        data: {
          id: uuidv4(),
          responsibleName: body.responsibleName,
          clubName: body.clubName,
          cnpj: formattedCnpj,
          address: body.address,
          city: body.city,
          state: body.state,
          zipCode: body.zipCode,
          phone: body.phone,
          email: body.email,
          paymentStatus: paymentStatus,
          active: isManualRegistration, // Ativa imediatamente apenas se for registro manual
          updatedAt: new Date()
        }
      });

      // Se for cadastro manual por admin, retornar diretamente
      if (isManualRegistration) {
        return NextResponse.json({
          success: true,
          message: 'Clube cadastrado com sucesso',
          club: newClub
        });
      }

      // Gerar pagamento
      const payment = await prisma.payment.create({
        data: {
          id: uuidv4(),
          amount: parseFloat(fees.newRegistrationFee.toString()),
          status: 'PENDING',
          updatedAt: new Date(),
          provider: 'MERCADO_PAGO',
          paymentMethod: 'PIX',
          currency: 'BRL',
          externalId: uuidv4(),
          paymentData: {
            type: 'CLUB_REGISTRATION',
            description: `Nova filiação do clube: ${body.clubName}`,
            userId: session.user.id
          },
          Club: {
            connect: {
              id: newClub.id
            }
          }
        }
      });

      // Atualizar clube com ID do pagamento
      await prisma.club.update({
        where: { id: newClub.id },
        data: { paymentId: payment.id }
      });

      return NextResponse.json({
        success: true,
        paymentId: payment.id,
        clubId: newClub.id,
        amount: fees.newRegistrationFee
      });
    } else {
      // Renovação de anuidade
      const existingClub = await prisma.club.findUnique({
        where: { cnpj: formattedCnpj }
      });

      if (!existingClub) {
        return NextResponse.json(
          { error: 'Clube não encontrado com este CNPJ' },
          { status: 404 }
        );
      }

      // Se for renovação manual por admin
      if (isManualRegistration) {
        await prisma.club.update({
          where: { id: existingClub.id },
          data: {
            active: true,
            paymentStatus: 'CONFIRMED',
            updatedAt: new Date()
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Anuidade renovada com sucesso',
          club: existingClub
        });
      }

      // Gerar pagamento para renovação
      const payment = await prisma.payment.create({
        data: {
          id: uuidv4(),
          amount: parseFloat(fees.annualRenewalFee.toString()),
          status: 'PENDING',
          updatedAt: new Date(),
          provider: 'MERCADO_PAGO',
          paymentMethod: 'PIX',
          currency: 'BRL',
          externalId: uuidv4(),
          paymentData: {
            type: 'CLUB_RENEWAL',
            description: `Renovação de anuidade do clube: ${existingClub.clubName}`,
            userId: session.user.id
          },
          Club: {
            connect: {
              id: existingClub.id
            }
          }
        }
      });

      // Atualizar clube com ID do pagamento
      await prisma.club.update({
        where: { id: existingClub.id },
        data: { 
          paymentId: payment.id,
          paymentStatus: 'PENDING',
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        paymentId: payment.id,
        clubId: existingClub.id,
        amount: fees.annualRenewalFee
      });
    }
  } catch (error) {
    console.error('Erro ao processar filiação de clube:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}

// GET /api/filiacao/clube - Lista todos os clubes (apenas para admin)
export async function GET() {
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

    // Buscar todos os clubes
    const clubs = await prisma.club.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(clubs);
  } catch (error) {
    console.error('Erro ao listar clubes:', error);
    return NextResponse.json(
      { error: 'Erro ao listar clubes' },
      { status: 500 }
    );
  }
}
