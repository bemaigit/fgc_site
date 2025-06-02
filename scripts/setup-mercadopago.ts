import { PrismaClient } from "@prisma/client"
import { PaymentProvider, PaymentMethod, EntityType } from "@/lib/payment/types"

const prisma = new PrismaClient()

async function main() {
  const mpConfig = await prisma.paymentGatewayConfig.create({
    data: {
      id: "mercadopago-default",
      name: "Mercado Pago",
      provider: "MERCADO_PAGO",
      active: true,
      priority: 1,
      allowedMethods: [
        PaymentMethod.PIX,
        PaymentMethod.CREDIT_CARD,
        PaymentMethod.BOLETO
      ],
      entityTypes: [
        EntityType.ATHLETE,
        EntityType.CLUB,
        EntityType.EVENT
      ],
      checkoutType: "REDIRECT",
      sandbox: true,
      webhook: {
        url: "/api/webhooks/payment?provider=MERCADO_PAGO",
        secret: process.env.MP_WEBHOOK_SECRET
      },
      urls: {
        success: "/pagamento/sucesso",
        failure: "/pagamento/erro",
        pending: "/pagamento/pendente"
      },
      credentials: {
        access_token: process.env.MP_SANDBOX_ACCESS_TOKEN,
        public_key: process.env.MP_SANDBOX_PUBLIC_KEY
      },
      createdBy: "SYSTEM",
      updatedBy: "SYSTEM"
    }
  })

  console.log("Configuração do Mercado Pago criada:", mpConfig)
}

main()
  .catch((error) => {
    console.error("Erro ao criar configuração:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
