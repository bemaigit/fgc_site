import { prisma } from "@/lib/prisma"
import { TransactionType, PaymentStatus } from "@/lib/payment/types"

export class ProtocolService {
  private static instance: ProtocolService
  private constructor() {}

  public static getInstance(): ProtocolService {
    if (!ProtocolService.instance) {
      ProtocolService.instance = new ProtocolService()
    }
    return ProtocolService.instance
  }

  async generateProtocol(data: {
    type: TransactionType
    entityId: string
    paymentId: string
    status: PaymentStatus
    metadata?: Record<string, any>
  }) {
    try {
      // Gerar número de protocolo único
      const year = new Date().getFullYear()
      const count = await this.getNextSequence(data.type, year)
      
      const protocolNumber = this.formatProtocolNumber({
        type: data.type,
        year,
        sequence: count
      })

      // Criar registro do protocolo
      const protocol = await prisma.protocol.create({
        data: {
          number: protocolNumber,
          type: data.type,
          entityId: data.entityId,
          paymentId: data.paymentId,
          status: data.status,
          metadata: data.metadata || {},
          year
        }
      })

      return protocol
    } catch (error) {
      console.error("Erro ao gerar protocolo:", error)
      throw new Error("Falha ao gerar protocolo")
    }
  }

  async updateProtocolStatus(
    protocolNumber: string,
    status: PaymentStatus
  ) {
    return prisma.protocol.update({
      where: { number: protocolNumber },
      data: { status }
    })
  }

  async getProtocolByNumber(number: string) {
    return prisma.protocol.findUnique({
      where: { number }
    })
  }

  async getProtocolsByEntity(entityId: string) {
    return prisma.protocol.findMany({
      where: { entityId },
      orderBy: { createdAt: "desc" }
    })
  }

  private async getNextSequence(type: TransactionType, year: number) {
    const result = await prisma.protocolSequence.upsert({
      where: {
        type_year: {
          type,
          year
        }
      },
      update: {
        sequence: { increment: 1 }
      },
      create: {
        type,
        year,
        sequence: 1
      }
    })

    return result.sequence
  }

  private formatProtocolNumber({
    type,
    year,
    sequence
  }: {
    type: TransactionType
    year: number
    sequence: number
  }) {
    const typePrefix = {
      [TransactionType.MEMBERSHIP]: "FIL",
      [TransactionType.EVENT]: "EVT",
      [TransactionType.CLUB]: "CLB",
      [TransactionType.OTHER]: "OTH"
    }[type]

    // Formato: FIL2025000001
    return `${typePrefix}${year}${sequence.toString().padStart(6, "0")}`
  }
}
