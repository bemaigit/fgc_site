import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { prisma } from "@/lib/prisma"
import { getPaymentGateway } from "@/lib/payment/factory"
import { PaymentStatus } from "@/lib/payment/types"

export async function POST(request: NextRequest) {
  try {
    const { paymentId, cardData } = await request.json()

    if (!paymentId || !cardData) {
      return NextResponse.json(
        { message: "Dados incompletos" },
        { status: 400 }
      )
    }

    // Buscar a transação
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: paymentId },
      include: {
        gatewayConfig: true
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { message: "Transação não encontrada" },
        { status: 404 }
      )
    }

    // Inicializar gateway
    const gateway = getPaymentGateway(transaction.gatewayConfig.provider, {
      credentials: transaction.gatewayConfig.credentials,
      sandbox: transaction.gatewayConfig.sandbox
    })

    // Atualizar transação com dados do cartão
    await prisma.paymentTransaction.update({
      where: { id: paymentId },
      data: {
        installments: cardData.installments,
        updatedAt: new Date()
      }
    })

    // Processar pagamento no gateway
    const paymentResult = await gateway.processCardPayment({
      id: transaction.externalId,
      cardToken: cardData.token,
      installments: cardData.installments,
      holderName: cardData.holderName,
      expiryMonth: cardData.expiryMonth,
      expiryYear: cardData.expiryYear
    })

    // Atualizar status da transação
    await prisma.paymentTransaction.update({
      where: { id: paymentId },
      data: {
        status: paymentResult.status,
        updatedAt: new Date()
      }
    })

    // Criar histórico de pagamento
    await prisma.paymentHistory.create({
      data: {
        id: uuidv4(),
        transactionId: paymentId,
        status: paymentResult.status,
        metadata: {
          source: "credit_card_processing",
          ...paymentResult.metadata
        },
        createdAt: new Date()
      }
    })

    // Processar ações baseadas no status
    if (paymentResult.status === PaymentStatus.PAID) {
      await processApprovedPayment(transaction.id)
    }

    return NextResponse.json({
      status: paymentResult.status,
      message: getStatusMessage(paymentResult.status)
    })
  } catch (error) {
    console.error("Erro ao processar pagamento com cartão:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erro ao processar pagamento com cartão" },
      { status: 500 }
    )
  }
}

async function processApprovedPayment(transactionId: string) {
  try {
    // Buscar detalhes completos da transação
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId }
    })

    if (!transaction) return

    // Processar com base no tipo de entidade
    if (transaction.entityType === "EVENT_REGISTRATION" && transaction.registrationId) {
      // Atualizar status da inscrição para confirmada
      await prisma.eventRegistration.update({
        where: { id: transaction.registrationId },
        data: { status: "CONFIRMED" }
      })
    } else if (transaction.entityType === "ATHLETE_MEMBERSHIP" && transaction.athleteId) {
      // Implementação futura para filiações
    }
  } catch (error) {
    console.error("Erro ao processar pagamento aprovado:", error)
  }
}

function getStatusMessage(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.PAID:
      return "Pagamento aprovado"
    case PaymentStatus.PENDING:
      return "Pagamento em análise"
    case PaymentStatus.PROCESSING:
      return "Processando pagamento"
    case PaymentStatus.FAILED:
      return "Pagamento recusado"
    case PaymentStatus.EXPIRED:
      return "Pagamento expirado"
    case PaymentStatus.CANCELED:
      return "Pagamento cancelado"
    case PaymentStatus.REFUNDED:
      return "Pagamento estornado"
    default:
      return "Status desconhecido"
  }
}
