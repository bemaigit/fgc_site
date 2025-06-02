import mercadopago from "mercadopago"

export function createMercadoPagoClient(accessToken: string) {
  // @ts-ignore - A versão antiga do SDK tem uma tipagem diferente
  mercadopago.configurations.setAccessToken(accessToken)
  return mercadopago
}

export function verifyMercadoPagoSignature(request: Request): boolean {
  try {
    const signature = request.headers.get("x-signature")
    const timestamp = request.headers.get("x-timestamp")
    const requestId = request.headers.get("x-request-id")
    
    if (!signature || !timestamp || !requestId) {
      console.error("Headers de segurança ausentes")
      return false
    }

    // Verificar se o timestamp não é muito antigo (máx 5 minutos)
    const timestampDate = new Date(Number(timestamp))
    const now = new Date()
    const fiveMinutes = 5 * 60 * 1000 // 5 minutos em milissegundos
    
    if (now.getTime() - timestampDate.getTime() > fiveMinutes) {
      console.error("Webhook expirado")
      return false
    }

    // Na produção, implementar a verificação criptográfica da assinatura
    // usando a chave secreta do Mercado Pago
    // https://www.mercadopago.com.br/developers/pt/docs/checkout-api/additional-content/security/webhooks
    
    return true
  } catch (error) {
    console.error("Erro ao verificar assinatura:", error)
    return false
  }
}
