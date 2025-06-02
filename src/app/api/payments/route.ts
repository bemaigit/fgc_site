import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { PaymentMethod, PaymentStatus, type CreatePaymentInput } from "@/lib/payment/types"
import { prisma } from "@/lib/prisma"
import { getPaymentGateway } from "@/lib/payment/factory"
import { EntityType, TransactionType } from "@/lib/payment/types"

// Simulação de armazenamento de pagamentos
const paymentsStore = new Map()

export async function POST(request: NextRequest) {
  try {
    const paymentData: CreatePaymentInput = await request.json()

    // Validação básica
    if (!paymentData.amount || !paymentData.paymentMethod || !paymentData.customer) {
      return NextResponse.json(
        { message: "Dados de pagamento incompletos" },
        { status: 400 }
      )
    }

    // Gerar número de protocolo
    // Formato: EVE-YYYYMMDD-XXXX (EVE = tipo de transação, YYYYMMDD = data, XXXX = números aleatórios)
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const randomPart = Math.floor(1000 + Math.random() * 9000)
    
    const protocolNumber = `EVE-${year}${month}${day}-${randomPart}`
    
    // Determinar o tipo de entidade com base nos metadados
    // Nota: No banco de dados, os tipos são "EVENT", "ATHLETE", "CLUB", "FEDERATION"
    const entityType = paymentData.metadata?.type === "EVENT" ? "EVENT" : "ATHLETE"
    
    console.log(`Buscando gateway para o tipo de entidade: ${entityType}`)
    console.log(`Método de pagamento: ${paymentData.paymentMethod}`)
    
    // Primeiro, tentar encontrar um gateway que suporte o tipo de entidade específico
    let gatewayConfig = await prisma.paymentGatewayConfig.findFirst({
      where: {
        active: true,
        entityTypes: {
          has: entityType
        }
      },
      orderBy: {
        priority: 'desc'
      }
    })
    
    // Se não encontrar, usar qualquer gateway ativo
    if (!gatewayConfig) {
      console.log("Nenhum gateway específico encontrado. Buscando qualquer gateway ativo...")
      gatewayConfig = await prisma.paymentGatewayConfig.findFirst({
        where: {
          active: true
        },
        orderBy: {
          priority: 'desc'
        }
      })
    }
    
    console.log(`Gateway encontrado: ${gatewayConfig?.provider || 'Nenhum'}`)
    
    // Para debug, listar todos os gateways ativos
    const allGateways = await prisma.paymentGatewayConfig.findMany({
      where: {
        active: true
      },
      select: {
        id: true,
        name: true,
        provider: true,
        entityTypes: true,
        allowedMethods: true
      }
    })
    
    console.log("Todos os gateways ativos:", JSON.stringify(allGateways, null, 2))

    if (!gatewayConfig) {
      return NextResponse.json(
        { message: "Gateway de pagamento não configurado" },
        { status: 500 }
      )
    }

    // Preparar input para criação do pagamento
    const metadata: Record<string, any> = paymentData.metadata || {};

    // Criar transação no banco
    const transaction = await prisma.paymentTransaction.create({
      data: {
        id: uuidv4(),
        protocol: protocolNumber,
        gatewayConfigId: gatewayConfig.id,
        entityId: metadata.entityId || '',
        entityType: metadata.type === "EVENT" ? "EVENT_REGISTRATION" : "ATHLETE_MEMBERSHIP",
        amount: paymentData.amount,
        description: paymentData.description,
        paymentMethod: paymentData.paymentMethod,
        status: 'PENDING' as any,
        athleteId: paymentData.metadata?.athleteId as string | undefined,
        metadata: {
          // Garantir que metadata seja um objeto antes de usar spread
          ...(paymentData.metadata && typeof paymentData.metadata === 'object' ? paymentData.metadata : {}),
          registrationId: paymentData.metadata?.registrationId || null,
          installments: paymentData.cardData?.installments || 1
        },
        updatedAt: new Date()
      }
    })

    // Inicializar gateway de pagamento
    // @ts-ignore - Ignorar erro de tipagem do provider
    const gateway = getPaymentGateway(gatewayConfig.provider, {
      credentials: gatewayConfig.credentials,
      sandbox: gatewayConfig.sandbox
    })

    // Preparar dados para o gateway
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const webhookUrl = `${baseUrl}/api/payments/gateway/webhook`;
    
    console.log("URL base da API:", baseUrl);
    console.log("URL de webhook para notificações:", webhookUrl);
    
    const gatewayInput = {
      ...paymentData,
      metadata: {
        ...paymentData.metadata,
        transactionId: transaction.id,
        referenceCode: protocolNumber
      },
      notificationUrl: webhookUrl
    }

    // Processar pagamento no gateway com base no método de pagamento
    let paymentResult;
    
    // Para cartão de crédito, não processamos o pagamento aqui - apenas criamos o registro
    // O processamento real acontecerá quando o usuário enviar os dados do cartão
    if (paymentData.paymentMethod === PaymentMethod.CREDIT_CARD || paymentData.paymentMethod === PaymentMethod.DEBIT_CARD) {
      console.log("Criando registro para pagamento com cartão, sem processar ainda");
      // Simular um resultado de pagamento pendente
      paymentResult = {
        id: transaction.id,
        status: 'PENDING' as any,
        amount: paymentData.amount
      };
    } else {
      console.log("Usando método createPayment para outros métodos de pagamento");
      paymentResult = await gateway.createPayment(gatewayInput);
    }

    // Atualizar transação com dados do gateway
    console.log("Atualizando transação com dados do gateway:", {
      id: transaction.id,
      externalId: paymentResult.id,
      paymentUrl: paymentResult.paymentUrl,
      status: paymentResult.status
    });
    
    // Armazenar dados do PIX no metadata para não perder informações
    const updatedMetadata = {
      // Verificar se metadata é um objeto válido antes de usar spread
      ...(transaction.metadata && typeof transaction.metadata === 'object' 
        ? transaction.metadata as Record<string, any> 
        : {}),
      qrCode: paymentResult.qrCode,
      qrCodeBase64: paymentResult.qrCodeBase64,
      barcodeNumber: paymentResult.barcodeNumber
    };
    
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        externalId: paymentResult.id,
        paymentUrl: paymentResult.paymentUrl,
        status: paymentResult.status,
        metadata: updatedMetadata,
        updatedAt: new Date()
      }
    })

    // Criar histórico de pagamento
    await prisma.paymentHistory.create({
      data: {
        id: uuidv4(),
        transactionId: transaction.id,
        status: paymentResult.status,
        description: `Pagamento ${paymentResult.status === 'PENDING' ? 'iniciado' : 'processado'} via ${gateway.name}`,
        createdAt: new Date()
      }
    })

    // Preparar dados para a resposta
    // Adicionar prefixo data:image/png;base64, ao qrCodeBase64 se existir
    const qrCodeBase64 = paymentResult.qrCodeBase64 
      ? `data:image/png;base64,${paymentResult.qrCodeBase64}` 
      : paymentResult.paymentQrCodeUrl || undefined;
    
    // Retornar resposta
    return NextResponse.json({
      id: transaction.id,
      protocolNumber,
      status: paymentResult.status,
      amount: paymentData.amount,
      paymentUrl: paymentResult.paymentUrl,
      qrCode: paymentResult.qrCode,
      qrCodeBase64: qrCodeBase64,
      barcodeNumber: paymentResult.barcodeNumber
    })
  } catch (error) {
    console.error("Erro ao processar pagamento:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erro ao processar pagamento" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  
  if (!id) {
    return NextResponse.json(
      { message: "ID do pagamento não fornecido" },
      { status: 400 }
    )
  }
  
  try {
    // Buscar transação no banco de dados
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id }
    })
    
    if (!transaction) {
      return NextResponse.json(
        { message: "Pagamento não encontrado" },
        { status: 404 }
      )
    }
    
    // Obter configuração do gateway
    const gatewayConfig = await prisma.paymentGatewayConfig.findUnique({
      where: { id: transaction.gatewayConfigId }
    })
    
    if (!gatewayConfig) {
      return NextResponse.json(
        { message: "Configuração do gateway não encontrada" },
        { status: 500 }
      )
    }
    
    // Inicializar gateway
    // @ts-ignore - Ignorar erro de tipagem do provider e credentials
    const gateway = getPaymentGateway(gatewayConfig.provider, {
      credentials: gatewayConfig.credentials,
      sandbox: gatewayConfig.sandbox
    })
    
    // Verificar status atual no gateway (se tiver ID externo)
    if (transaction.externalId) {
      const currentStatus = await gateway.getPaymentStatus(transaction.externalId)
      
      // Atualizar status se mudou
      if (currentStatus !== transaction.status) {
        await prisma.paymentTransaction.update({
          where: { id },
          data: {
            status: currentStatus as any, // Cast para evitar erro de tipagem
            updatedAt: new Date()
          }
        })
        
        // Criar histórico de pagamento
        const statusMap: Record<string, any> = {
          'PENDING': 'PENDING',
          'PAID': 'PAID',
          'CONFIRMED': 'CONFIRMED',
          'FAILED': 'FAILED',
          'CANCELED': 'CANCELED',
          'REFUNDED': 'REFUNDED',
          'EXPIRED': 'EXPIRED'
        };
        
        // Mapear o status para um valor aceito pelo enum do Prisma
        const mappedStatus = statusMap[currentStatus] || 'PENDING';
        
        await prisma.paymentHistory.create({
          data: {
            id: uuidv4(),
            transactionId: id,
            status: mappedStatus, // Usar o status mapeado para o enum do Prisma
            description: `Status de pagamento atualizado para ${currentStatus}`,
            createdAt: new Date()
          }
        })
        
        transaction.status = currentStatus
      }
    }
    
    return NextResponse.json({
      id: transaction.id,
      protocol: transaction.protocol,
      status: transaction.status as string,
      amount: transaction.amount,
      paymentMethod: transaction.paymentMethod,
      paymentUrl: transaction.paymentUrl,
      qrCode: (transaction as any).qrCode,
      qrCodeBase64: (transaction as any).qrCodeBase64,
      barcodeNumber: (transaction as any).barcodeNumber,
      createdAt: transaction.createdAt
    })
  } catch (error) {
    console.error("Erro ao buscar pagamento:", error)
    return NextResponse.json(
      { message: "Erro ao buscar detalhes do pagamento" },
      { status: 500 }
    )
  }
}
