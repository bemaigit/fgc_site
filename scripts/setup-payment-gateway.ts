import { PrismaClient } from "@prisma/client"
import * as dotenv from "dotenv"

// Carregar variáveis de ambiente do .env
dotenv.config()

const prisma = new PrismaClient()

async function setupPaymentGateway() {
  try {
    console.log("🔵 Configurando gateway de pagamento...")

    // Criar configuração do gateway
    const gatewayConfig = await prisma.paymentGatewayConfig.upsert({
      where: {
        id: "mercadopago-default"
      },
      update: {},
      create: {
        id: "mercadopago-default",
        provider: "MERCADO_PAGO",
        name: "Mercado Pago",
        active: true,
        priority: 1,
        allowedMethods: ["CREDIT_CARD", "PIX", "BOLETO"],
        entityTypes: ["ATHLETE", "CLUB", "REGISTRATION"],
        checkoutType: "REDIRECT",
        sandbox: false, // Produção
        webhook: {
          url: process.env.NEXT_PUBLIC_API_URL + "/api/webhooks/payment",
          secret: process.env.MERCADO_PAGO_WEBHOOK_SECRET || ""
        },
        urls: {
          success: process.env.NEXT_PUBLIC_API_URL + "/payment/success",
          failure: process.env.NEXT_PUBLIC_API_URL + "/payment/failure",
          pending: process.env.NEXT_PUBLIC_API_URL + "/payment/pending"
        },
        credentials: {
          accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
          publicKey: process.env.MERCADO_PAGO_PUBLIC_KEY || ""
        },
        createdBy: "system",
        updatedBy: "system"
      }
    })

    console.log("✅ Configuração do gateway criada:", gatewayConfig.id)
    console.log("✅ Gateway configurado com sucesso!")
  } catch (error) {
    console.error("❌ Erro ao configurar gateway:", error)
  } finally {
    await prisma.$disconnect()
  }
}

setupPaymentGateway()
