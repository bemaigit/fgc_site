import { NextRequest, NextResponse } from "next/server"
import { PaymentProvider } from "@/lib/payment/types"
import { paymentGatewayService } from "@/lib/payment/gateway"
import { prisma } from "@/lib/prisma"
import { membershipService } from "@/lib/membership/service"
import crypto from 'crypto'

// Função auxiliar para logging
function logWebhook(message: string, data?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] 🔔 Webhook: ${message}`)
  if (data) {
    console.log(JSON.stringify(data, null, 2))
  }
}

export async function POST(req: NextRequest) {
  try {
    // Extrair headers importantes
    const providerParam = req.nextUrl.searchParams.get("provider")
    const provider = providerParam?.toUpperCase() as PaymentProvider | undefined
    const signature = req.headers.get("x-signature") || undefined
    const timestamp = req.headers.get("x-timestamp") || undefined

    logWebhook("Recebido novo webhook", {
      provider,
      signature,
      timestamp
    })

    // Validar provider
    if (!provider) {
      logWebhook("❌ Provider não especificado")
      return NextResponse.json({ error: "Provider not specified" }, { status: 400 })
    }

    // Obter gateway ativo para provider
    const gateway = await paymentGatewayService.getActiveGateway(provider)
    if (!gateway) {
      logWebhook("❌ Gateway não encontrado")
      return NextResponse.json({ error: "Payment gateway not found" }, { status: 500 })
    }

    // Ler payload e validar assinatura genérica
    const body = await req.json()
    logWebhook("📦 Webhook recebido", { provider, body })
    const validSig = await gateway.validateWebhook(body, signature)
    if (!validSig) {
      logWebhook("❌ Assinatura inválida para provider " + provider)
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // Extrair dados padronizados
    const result = await gateway.parseWebhookData(body)
    // Persistir registro de pagamento
    await prisma.payment.upsert({
      where: { id: result.id },
      create: {
        id: result.id,
        status: result.status,
        amount: result.amount,
        currency: typeof result.metadata?.currency === 'string' ? result.metadata.currency : 'BRL',
        provider: typeof provider === 'string' ? provider : '',
        paymentMethod: typeof result.metadata?.paymentMethod === 'string' ? result.metadata.paymentMethod : '',
        externalId: result.id,
        paymentData: body,
        registrationId: result.metadata?.entityType === 'EVENT' && result.metadata.entityId ? result.metadata.entityId : null,
        athleteId: result.metadata?.entityType === 'ATHLETE' && result.metadata.entityId ? result.metadata.entityId : null,
        clubId: result.metadata?.entityType === 'CLUB' && result.metadata.entityId ? result.metadata.entityId : null,
        updatedAt: new Date(),
      },
      update: { status: result.status, updatedAt: new Date() }
    })
    // Atualizar conforme tipo
    if (result.metadata?.entityType === 'EVENT' && result.metadata.entityId) {
      // Atualiza somente se registro existir (updateMany não dispara erro se não encontrar)
      await prisma.registration.updateMany({ where: { id: result.metadata.entityId }, data: { status: 'CONFIRMED' } })
    } else if (result.metadata?.entityType === 'MEMBERSHIP' && result.metadata.entityId) {
      await membershipService.activateMembership(result.metadata.entityId)
    }
    return NextResponse.json({ id: result.id, status: result.status })

  } catch (error: any) {
    logWebhook("❌ Erro ao processar webhook", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
