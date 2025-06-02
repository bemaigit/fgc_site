import { MercadoPagoConfig, Webhook } from 'mercadopago';

async function main() {
  try {
    console.log('Configurando webhook do Mercado Pago...');
    
    const client = new MercadoPagoConfig({ 
      accessToken: process.env.MP_SANDBOX_ACCESS_TOKEN! 
    });

    const webhook = new Webhook(client);
    
    // Configurar webhook
    const result = await webhook.create({
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/payment`,
      events: [
        'payment.created',
        'payment.updated'
      ]
    });

    console.log('Webhook configurado com sucesso:', result);
  } catch (error) {
    console.error('Erro ao configurar webhook:', error);
  }
}

main();
