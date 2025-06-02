import fetch from 'node-fetch'

async function testWebhook() {
  const webhookUrl = 'https://ad4e-189-123-162-163.ngrok-free.app/api/webhooks/payment?provider=MERCADO_PAGO'
  const accessToken = process.env.MP_SANDBOX_ACCESS_TOKEN

  // Simular uma notificação de pagamento do Mercado Pago
  const webhookData = {
    action: "payment.created",
    data: {
      id: "test_payment_123",
    }
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'x-signature': 'test_signature',
        'x-request-id': 'test_request_123'
      },
      body: JSON.stringify(webhookData)
    })

    const data = await response.json()
    console.log('Resposta do webhook:', data)
  } catch (error) {
    console.error('Erro ao testar webhook:', error)
  }
}

testWebhook()
