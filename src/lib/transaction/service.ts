import { PrismaClient, PaymentEntityType } from "@prisma/client"
import { 
  PaymentMethod,
  TransactionType,
  PaymentStatus
} from "../payment/types"
import cuid from "cuid"

const prisma = new PrismaClient()

export type TransactionData = {
  type: TransactionType
  entityId: string
  entityType: PaymentEntityType
  amount: number
  status: PaymentStatus
  paymentId: string
  protocol: string
  metadata?: Record<string, any>
  gatewayId: string
  paymentMethod: PaymentMethod
}

export class TransactionService {
  private static instance: TransactionService

  private constructor() {}

  public static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService()
    }
    return TransactionService.instance
  }

  async createTransaction(data: TransactionData) {
    try {
      const transaction = await prisma.paymentTransaction.create({
        data: {
          id: cuid(),
          gatewayConfigId: data.gatewayId,
          entityId: data.entityId,
          entityType: data.entityType,
          amount: data.amount,
          status: data.status,
          externalId: data.paymentId,
          protocol: data.protocol,
          metadata: data.metadata || {},
          paymentMethod: data.paymentMethod,
          updatedAt: new Date()
        }
      })

      return transaction
    } catch (error) {
      console.error("Error creating transaction:", error)
      throw error
    }
  }

  async findTransactionByExternalId(paymentId: string) {
    try {
      const transaction = await prisma.paymentTransaction.findFirst({
        where: { externalId: paymentId }
      })
      
      return transaction
    } catch (error) {
      console.error("Error finding transaction:", error)
      throw error
    }
  }

  async updateTransactionStatus(paymentId: string, status: PaymentStatus) {
    try {
      // Primeiro, buscar a transação
      const transaction = await prisma.paymentTransaction.findFirst({
        where: { externalId: paymentId }
      })

      if (!transaction) {
        throw new Error(`Transaction not found for paymentId: ${paymentId}`)
      }

      // Atualizar status
      const updated = await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: { 
          status,
          updatedAt: new Date()
        }
      })

      return updated
    } catch (error) {
      console.error("Error updating transaction status:", error)
      throw error
    }
  }
}

// Instância global do serviço
export const transactionService = TransactionService.getInstance()
