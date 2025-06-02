import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { PaymentMethod, PaymentStatus, PaymentEntityType } from "@prisma/client"
import { Prisma } from "@prisma/client"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || session.user.role !== "SUPER_ADMIN") {
      return Response.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const url = new URL(req.url)
    const search = url.searchParams.get('search')
    const status = url.searchParams.get('status')
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')

    // Construir query
    const where: Prisma.PaymentTransactionWhereInput = {}

    // Filtro de busca
    if (search) {
      where.OR = [
        { protocol: { contains: search, mode: "insensitive" } },
        { athlete: { 
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { cpf: { contains: search, mode: "insensitive" } }
          ]
        }}
      ]
    }

    // Filtro de status
    if (status && status !== 'ALL') {
      where.status = status as PaymentStatus
    }

    // Filtro de data
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    // Buscar transações
    const transactions = await prisma.paymentTransaction.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Buscar detalhes adicionais
    const detailedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        const [athlete, history] = await Promise.all([
          transaction.athleteId 
            ? prisma.athlete.findUnique({ where: { id: transaction.athleteId } })
            : null,
          prisma.paymentHistory.findMany({
            where: { transactionId: transaction.id },
            orderBy: { createdAt: 'desc' }
          })
        ])

        return {
          id: transaction.id,
          protocol: transaction.protocol,
          customerName: athlete?.fullName || "N/A",
          customerDocument: athlete?.cpf || "N/A",
          amount: Number(transaction.amount),
          status: transaction.status,
          paymentMethod: transaction.paymentMethod,
          description: `Pagamento ${transaction.protocol}`,
          createdAt: transaction.createdAt.toISOString(),
          updatedAt: transaction.updatedAt.toISOString(),
          metadata: transaction.metadata || {},
          history: history.map(h => ({
            status: h.status,
            description: h.description,
            timestamp: h.createdAt.toISOString()
          }))
        }
      })
    )

    return Response.json(detailedTransactions)
  } catch (error) {
    console.error("Erro ao buscar transações:", error)
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || session.user.role !== "SUPER_ADMIN") {
      return Response.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { 
      protocol, 
      amount, 
      status, 
      paymentMethod, 
      entityId, 
      entityType, 
      gatewayConfigId 
    }: {
      protocol: string
      amount: number
      status: PaymentStatus
      paymentMethod: PaymentMethod
      entityId: string
      entityType: PaymentEntityType
      gatewayConfigId: string
    } = await req.json()

    const transaction = await prisma.paymentTransaction.create({
      data: {
        protocol,
        amount,
        status,
        paymentMethod,
        entityId,
        entityType,
        gatewayConfigId
      }
    })

    return Response.json(transaction)
  } catch (error) {
    console.error("Erro ao criar transação:", error)
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
