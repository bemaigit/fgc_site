import { NextRequest, NextResponse } from "next/server"
import { createPaymentGateway } from "@/lib/payment/factory"
import { EntityType, PaymentProvider } from "@/lib/payment/types"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Obter parâmetros da query
    const searchParams = request.nextUrl.searchParams
    const amount = searchParams.get("amount")
    const entityType = searchParams.get("entityType") || EntityType.EVENT
    const paymentMethodId = searchParams.get("paymentMethodId")
    const bin = searchParams.get("bin")
    
    if (!amount || isNaN(Number(amount))) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 })
    }
    
    // Buscar gateway de pagamento configurado para a entidade
    const gatewayConfig = await prisma.paymentGatewayConfig.findFirst({
      where: {
        entityTypes: {
          has: entityType as string
        },
        active: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
    
    if (!gatewayConfig) {
      return NextResponse.json({ error: "Gateway de pagamento não configurado" }, { status: 404 })
    }
    
    // Inicializar gateway com as credenciais
    const gateway = createPaymentGateway({
      provider: gatewayConfig.provider as PaymentProvider,
      credentials: gatewayConfig.credentials,
      sandbox: gatewayConfig.sandbox || false
    })
    
    // Obter opções de parcelamento
    const installmentOptions = await gateway.getInstallmentOptions(
      Number(amount),
      paymentMethodId || undefined,
      bin || undefined
    )
    
    return NextResponse.json({ installmentOptions })
  } catch (error) {
    console.error("Erro ao obter opções de parcelamento:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao obter opções de parcelamento" },
      { status: 500 }
    )
  }
}
