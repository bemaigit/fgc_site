import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: { transactionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role || session.user.role !== "SUPER_ADMIN") {
      return Response.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Buscar transação com todos os detalhes
    const transaction = await prisma.transaction.findUnique({
      where: { id: params.transactionId },
      include: {
        athlete: {
          include: {
            user: true
          }
        },
        history: {
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    })

    if (!transaction) {
      return Response.json(
        { error: "Transação não encontrada" },
        { status: 404 }
      )
    }

    // Formatar resposta
    return Response.json({
      id: transaction.id,
      protocol: transaction.protocol,
      customerName: transaction.athlete?.fullName || "N/A",
      customerEmail: transaction.athlete?.user?.email || "N/A",
      customerDocument: transaction.athlete?.cpf || "N/A",
      amount: transaction.amount,
      status: transaction.status,
      paymentMethod: transaction.metadata?.paymentMethod || "N/A",
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
      metadata: transaction.metadata || {},
      history: transaction.history.map(event => ({
        status: event.status,
        timestamp: event.createdAt.toISOString(),
        description: event.description
      }))
    })
  } catch (error) {
    console.error("Erro ao buscar detalhes da transação:", error)
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
