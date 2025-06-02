export * from "./types"
export * from "./factory"
export * from "./service"
export * from "./mercadopago"
export * from "./pagseguro"
export * from "./asaas"
export * from "./paghiper"

// Instância global do serviço de pagamento
import { PaymentService } from "./service"

export const paymentService = new PaymentService()

// Inicializar o serviço
paymentService.initialize().catch(error => {
  console.error("Erro ao inicializar serviço de pagamento:", error)
})
