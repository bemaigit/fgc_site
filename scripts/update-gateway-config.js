// Script para atualizar a configuração do gateway de pagamento
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateGatewayConfig() {
  try {
    // Buscar o gateway do Mercado Pago
    const mercadoPagoGateway = await prisma.paymentGatewayConfig.findFirst({
      where: {
        provider: 'MERCADO_PAGO',
        active: true
      }
    });

    if (!mercadoPagoGateway) {
      console.log('Gateway do Mercado Pago não encontrado!');
      return;
    }

    console.log('Gateway encontrado:', mercadoPagoGateway.id);
    console.log('Tipos de entidade atuais:', mercadoPagoGateway.entityTypes);

    // Atualizar os tipos de entidade para incluir EVENT_REGISTRATION
    const updatedGateway = await prisma.paymentGatewayConfig.update({
      where: {
        id: mercadoPagoGateway.id
      },
      data: {
        entityTypes: ['ATHLETE_MEMBERSHIP', 'EVENT_REGISTRATION', 'CLUB_MEMBERSHIP', 'FEDERATION_PAYMENT'],
        allowedMethods: ['CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BOLETO']
      }
    });

    console.log('Gateway atualizado com sucesso!');
    console.log('Novos tipos de entidade:', updatedGateway.entityTypes);
    console.log('Métodos de pagamento:', updatedGateway.allowedMethods);

  } catch (error) {
    console.error('Erro ao atualizar gateway:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateGatewayConfig()
  .then(() => console.log('Script finalizado'))
  .catch(console.error);
