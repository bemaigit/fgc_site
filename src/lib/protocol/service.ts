import { PrismaClient, PaymentStatus } from "@prisma/client"
import { TransactionType } from "../payment/types"
import cuid from "cuid"

const prisma = new PrismaClient()

export type ProtocolData = {
  type: TransactionType
  entityId: string
  paymentId: string
  status: PaymentStatus
  metadata?: Record<string, any>
}

export class ProtocolService {
  private static instance: ProtocolService

  private constructor() {}

  public static getInstance(): ProtocolService {
    if (!ProtocolService.instance) {
      ProtocolService.instance = new ProtocolService()
    }
    return ProtocolService.instance
  }

  private generateProtocolNumber(): string {
    const timestamp = new Date().getTime().toString()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${timestamp}${random}`
  }

  async generateProtocol(data: ProtocolData) {
    try {
      const protocolNumber = this.generateProtocolNumber()
      const now = new Date()

      const protocol = await prisma.protocol.create({
        data: {
          id: cuid(),
          number: protocolNumber,
          type: data.type.toString(),
          entityId: data.entityId,
          paymentId: data.paymentId,
          status: data.status.toString(),
          metadata: data.metadata || {},
          year: now.getFullYear(),
          updatedAt: now
        }
      })

      return protocol
    } catch (error) {
      console.error("Error generating protocol:", error)
      throw error
    }
  }

  async updateProtocolStatus(protocolNumber: string, status: PaymentStatus) {
    try {
      const protocol = await prisma.protocol.update({
        where: { number: protocolNumber },
        data: { 
          status: status.toString(),
          updatedAt: new Date()
        }
      })

      return protocol
    } catch (error) {
      console.error("Error updating protocol status:", error)
      throw error
    }
  }
}

// Instância global do serviço
export const protocolService = ProtocolService.getInstance()
