"use client"

import { PaymentProvider } from "./types"

// Interface para o objeto MercadoPago global
declare global {
  interface Window {
    MercadoPago?: any;
    PagSeguro?: any;
  }
}

// Função para o Mercado Pago
export async function tokenizeMercadoPagoCard(cardData: any) {
  // Verificar se o SDK do Mercado Pago está disponível
  if (!window.MercadoPago) {
    throw new Error("SDK do Mercado Pago não encontrado. Verifique se o script foi carregado corretamente.");
  }
  
  try {
    const mp = new window.MercadoPago(process.env.NEXT_PUBLIC_MP_SANDBOX_PUBLIC_KEY);
    
    const cardTokenResponse = await mp.createCardToken({
      cardNumber: cardData.number,
      cardholderName: cardData.holderName,
      cardExpirationMonth: cardData.expiryMonth,
      cardExpirationYear: cardData.expiryYear,
      securityCode: cardData.cvv,
    });
    
    if (!cardTokenResponse || !cardTokenResponse.id) {
      throw new Error("Não foi possível gerar o token do cartão");
    }
    
    return cardTokenResponse.id;
  } catch (error) {
    console.error("Erro ao tokenizar cartão no Mercado Pago:", error);
    throw new Error(error instanceof Error ? error.message : "Erro ao processar o cartão");
  }
}

// Função para o PagSeguro
export async function tokenizePagSeguroCard(cardData: any) {
  // Verificar se o SDK do PagSeguro está disponível
  if (!window.PagSeguro) {
    throw new Error("SDK do PagSeguro não encontrado. Verifique se o script foi carregado corretamente.");
  }
  
  try {
    const pgCard = window.PagSeguro.encryptCard({
      publicKey: process.env.NEXT_PUBLIC_PAGSEGURO_PUBLIC_KEY,
      holder: cardData.holderName,
      number: cardData.number,
      expMonth: cardData.expiryMonth,
      expYear: cardData.expiryYear,
      securityCode: cardData.cvv
    });
    
    if (!pgCard || !pgCard.encryptedCard) {
      throw new Error("Não foi possível gerar o token do cartão");
    }
    
    return pgCard.encryptedCard;
  } catch (error) {
    console.error("Erro ao tokenizar cartão no PagSeguro:", error);
    throw new Error(error instanceof Error ? error.message : "Erro ao processar o cartão");
  }
}

// Função genérica que escolhe o método correto com base no gateway
export async function tokenizeCard(gateway: PaymentProvider, cardData: any) {
  switch (gateway) {
    case PaymentProvider.MERCADO_PAGO:
      return tokenizeMercadoPagoCard(cardData);
    case PaymentProvider.PAGSEGURO:
      return tokenizePagSeguroCard(cardData);
    // Adicionar outros gateways conforme necessário
    default:
      throw new Error(`Gateway de pagamento não suportado: ${gateway}`);
  }
}

// Função para carregar o SDK do gateway de pagamento
export function loadPaymentSDK(gateway: PaymentProvider): Promise<void> {
  return new Promise((resolve, reject) => {
    // Verificar se o SDK já está carregado
    if (
      (gateway === PaymentProvider.MERCADO_PAGO && window.MercadoPago) ||
      (gateway === PaymentProvider.PAGSEGURO && window.PagSeguro)
    ) {
      resolve();
      return;
    }
    
    // Criar elemento de script
    const script = document.createElement("script");
    script.async = true;
    
    // Definir URL do SDK com base no gateway
    switch (gateway) {
      case PaymentProvider.MERCADO_PAGO:
        script.src = "https://sdk.mercadopago.com/js/v2";
        break;
      case PaymentProvider.PAGSEGURO:
        script.src = "https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js";
        break;
      default:
        reject(new Error(`Gateway de pagamento não suportado: ${gateway}`));
        return;
    }
    
    // Configurar eventos de carregamento
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Erro ao carregar SDK do ${gateway}`));
    
    // Adicionar script ao documento
    document.head.appendChild(script);
  });
}
