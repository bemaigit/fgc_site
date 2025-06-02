export interface TestGatewayResponse {
  success: boolean
  testTransactionId: string
  details: {
    status: string
    amount: number
    provider: string
    paymentUrl?: string
    qrCode?: string
  }
  error?: string
}