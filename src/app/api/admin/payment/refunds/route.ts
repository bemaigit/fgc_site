import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

// Schema de validação para reembolso
const refundSchema = z.object({
  transactionId: z.string(),
  reason: z.string(),
  amount: z.number().optional() // Para reembolso parcial
})

// Função auxiliar para verificar permissões
async function checkAdminPermission(session: any) {
  if (!session) {
    return false
  }
  return ["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
}

// Interface para serviços de gateway
interface PaymentGatewayService {
  refundPayment(transactionId: string, amount?: number): Promise<{
    success: boolean
    refundId?: string
    error?: string
  }>
}

// Implementação para MercadoPago
class MercadoPagoService implements PaymentGatewayService {
  async refundPayment(transactionId: string, amount?: number) {
    try {
      // TODO: Implementar integração real com MercadoPago
      return {
        success: true,
        refundId: "mp_" + Date.now()
      }
    } catch (error) {
      return {
        success: false,
        error: "Erro ao processar reembolso no MercadoPago"
      }
    }
  }
}

// Implementação para PagSeguro
class PagSeguroService implements PaymentGatewayService {
  async refundPayment(transactionId: string, amount?: number) {
    try {
      // TODO: Implementar integração real com PagSeguro
      return {
        success: true,
        refundId: "ps_" + Date.now()
      }
    } catch (error) {
      return {
        success: false,
        error: "Erro ao processar reembolso no PagSeguro"
      }
    }
  }
}

// Factory para criar serviço do gateway apropriado
function createGatewayService(provider: string): PaymentGatewayService {
  switch (provider.toUpperCase()) {
    case "MERCADOPAGO":
      return new MercadoPagoService()
    case "PAGSEGURO":
      return new PagSeguroService()
    default:
      throw new Error(`Gateway não suportado: ${provider}`)
  }
}

// POST - Criar reembolso
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!await checkAdminPermission(session)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const data = await request.json()
    const { transactionId, reason, amount } = refundSchema.parse(data)

    // Buscar transação
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: {
        gatewayConfig: true
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: "Transação não encontrada" },
        { status: 404 }
      )
    }

    if (transaction.status !== "PAID") {
      return NextResponse.json(
        { error: "Transação não está em estado válido para reembolso" },
        { status: 400 }
      )
    }

    // Processar reembolso no gateway
    const gatewayService = createGatewayService(transaction.gatewayConfig.provider)
    const refundResult = await gatewayService.refundPayment(
      transaction.externalId!,
      amount
    )

    if (!refundResult.success) {
      return NextResponse.json(
        { error: refundResult.error || "Erro ao processar reembolso" },
        { status: 500 }
      )
    }

    // Atualizar transação
    const updatedTransaction = await prisma.paymentTransaction.update({
      where: { id: transactionId },
      data: {
        status: "REFUNDED",
        metadata: {
          ...transaction.metadata,
          refund: {
            id: refundResult.refundId,
            reason,
            amount: amount || transaction.amount,
            date: new Date(),
            by: session.user.id
          }
        }
      }
    })

    // Atualizar entidade relacionada
    switch (transaction.entityType) {
      case "ATHLETE":
        await prisma.athlete.update({
          where: { id: transaction.entityId },
          data: { paymentStatus: "REFUNDED" }
        })
        break
      case "CLUB":
        await prisma.club.update({
          where: { id: transaction.entityId },
          data: { paymentStatus: "REFUNDED" }
        })
        break
      // Adicionar outros tipos conforme necessário
    }

    // TODO: Enviar email de confirmação do reembolso

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Erro ao processar reembolso:", error)
    return NextResponse.json(
      { error: "Erro ao processar reembolso" },
      { status: 500 }
    )
  }
}

// GET - Listar reembolsos
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!await checkAdminPermission(session)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    const refunds = await prisma.paymentTransaction.findMany({
      where: {
        status: "REFUNDED"
      },
      include: {
        gatewayConfig: {
          select: {
            name: true,
            provider: true
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.paymentTransaction.count({
      where: {
        status: "REFUNDED"
      }
    })

    return NextResponse.json({
      refunds,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Erro ao listar reembolsos:", error)
    return NextResponse.json(
      { error: "Erro ao listar reembolsos" },
      { status: 500 }
    )
  }
}
