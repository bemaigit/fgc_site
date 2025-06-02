import MercadoPagoSDK from 'mercadopago'
import { createHmac } from 'crypto'
import type { MercadoPagoClient } from 'mercadopago'
import crypto from 'crypto'

/**
 * Cria um cliente do Mercado Pago com o token de acesso fornecido
 * @param accessToken Token de acesso do Mercado Pago
 * @returns Cliente do Mercado Pago inicializado
 */
export function createMercadoPagoClient(accessToken: string): MercadoPagoClient {
  console.log("Criando cliente Mercado Pago com token:", accessToken.substring(0, 10) + "...");
  // Instancia o SDK corretamente para ter preference e payment
  return new MercadoPagoSDK({ accessToken });
}

/**
 * Verifica a assinatura de um webhook do Mercado Pago
 * @param signature Assinatura recebida no cabeçalho
 * @param payload Payload recebido no corpo da requisição
 * @param secret Segredo compartilhado para verificação
 * @returns Verdadeiro se a assinatura for válida
 */
export function verifyMercadoPagoSignature(
  signature: string,
  payload: string,
  secret: string
): boolean {
  if (!signature || !payload || !secret) {
    return false
  }

  try {
    const computedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    
    return computedSignature === signature
  } catch (error) {
    console.error('Erro ao verificar assinatura do Mercado Pago:', error)
    return false
  }
}
