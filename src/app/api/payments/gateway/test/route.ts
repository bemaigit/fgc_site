"use server"

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createPaymentGateway } from "@/lib/payment/factory"
import { PaymentMethod, PaymentProvider, EntityType, TransactionType } from "@/lib/payment/types"

export async function POST(request: Request) {
  try {
    console.log("Iniciando teste de gateway")
    
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "SUPER_ADMIN") {
      console.log("Usuário não autorizado")
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    // Obter dados do corpo da requisição
    const body = await request.json()
    console.log("Dados recebidos:", JSON.stringify(body, null, 2))
    
    const { gatewayId, amount, description } = body
    
    if (!gatewayId || !amount || !description) {
      console.log("Dados de pagamento ausentes:", body)
      return NextResponse.json(
        { error: "Dados de pagamento ausentes" },
        { status: 400 }
      )
    }

    // Buscar configuração do gateway
    const gateway = await prisma.paymentGatewayConfig.findUnique({
      where: { id: gatewayId }
    })

    if (!gateway) {
      console.log("Gateway não encontrado:", gatewayId)
      return NextResponse.json(
        { error: "Gateway não encontrado" },
        { status: 404 }
      )
    }

    const paymentGateway = createPaymentGateway({
      provider: gateway.provider as PaymentProvider,
      credentials: typeof gateway.credentials === 'string'
        ? JSON.parse(gateway.credentials)
        : gateway.credentials,
      sandbox: gateway.sandbox
    })

    console.log("Gateway de pagamento iniciado:", {
      provider: gateway.provider,
      sandbox: gateway.sandbox,
      hasCreatePayment: typeof paymentGateway.createPayment === 'function'
    })
    
    if (typeof paymentGateway.createPayment !== 'function') {
      throw new Error(`O gateway de pagamento ${gateway.provider} não implementa o método createPayment`)
    }

    // Criar pagamento de teste
    const paymentResult = await paymentGateway.createPayment({
      amount,
      description,
      metadata: {
        type: TransactionType.OTHER,
        entityId: 'test',
        entityType: 'TEST',
        testMode: true
      },
      customer: {
        name: "Usuário Teste",
        email: session.user.email || "teste@example.com",
        document: "12345678909",
        phone: "11999999999"
      },
      callbackUrls: {
        success: "https://example.com/success",
        failure: "https://example.com/failure",
        notification: "https://example.com/webhook"
      },
      paymentMethod: PaymentMethod.PIX
    })

    return NextResponse.json({
      success: true,
      result: paymentResult
    })
  } catch (error: any) {
    console.error("Erro detalhado ao testar gateway:", error)
    return NextResponse.json(
      { 
        error: error.message || "Erro ao testar gateway",
        details: error.toString()
      },
      { status: 500 }
    )
  }
}
