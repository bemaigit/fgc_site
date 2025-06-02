import { prisma } from "@/lib/prisma"
import { 
  TransactionType, 
  EntityType, 
  PaymentStatus,
  TransactionRecord
} from "@/lib/payment/types"

export class TransactionService {
  private static instance: TransactionService
  private constructor() {}

  public static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService()
    }
    return TransactionService.instance
  }

  async createTransaction(data: {
    type: TransactionType
    entityId: string
    entityType: EntityType
    amount: number
    status: PaymentStatus
    paymentId: string
    protocol?: string
    metadata?: Record<string, any>
  }): Promise<TransactionRecord> {
    return prisma.transaction.create({
      data: {
        type: data.type,
        entityId: data.entityId,
        entityType: data.entityType,
        amount: data.amount,
        status: data.status,
        paymentId: data.paymentId,
        protocol: data.protocol,
        metadata: data.metadata || {}
      }
    }) as Promise<TransactionRecord>
  }

  async updateTransactionStatus(
    paymentId: string,
    status: PaymentStatus,
    metadata?: Record<string, any>
  ) {
    return prisma.transaction.update({
      where: { paymentId },
      data: {
        status,
        ...(metadata && { metadata })
      }
    })
  }

  async getTransactionByPaymentId(paymentId: string) {
    return prisma.transaction.findUnique({
      where: { paymentId }
    })
  }

  async getTransactionsByEntity(entityId: string) {
    return prisma.transaction.findMany({
      where: { entityId },
      orderBy: { createdAt: "desc" }
    })
  }

  async getTransactionsByType(type: TransactionType, options?: {
    status?: PaymentStatus
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }) {
    const where: any = { type }

    if (options?.status) {
      where.status = options.status
    }

    if (options?.startDate || options?.endDate) {
      where.createdAt = {}
      if (options.startDate) {
        where.createdAt.gte = options.startDate
      }
      if (options.endDate) {
        where.createdAt.lte = options.endDate
      }
    }

    return prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: options?.offset || 0,
      take: options?.limit || 50
    })
  }

  async getTransactionStats(type: TransactionType, period: {
    startDate: Date
    endDate: Date
  }) {
    const transactions = await prisma.transaction.findMany({
      where: {
        type,
        createdAt: {
          gte: period.startDate,
          lte: period.endDate
        }
      },
      select: {
        status: true,
        amount: true
      }
    })

    return {
      total: transactions.length,
      totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
      byStatus: transactions.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }
}
