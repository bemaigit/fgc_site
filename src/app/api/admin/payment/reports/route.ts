import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

// Função auxiliar para verificar permissões
async function checkAdminPermission(session: any) {
  if (!session) {
    return false
  }
  return ["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
}

// GET - Obter métricas e relatórios
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!await checkAdminPermission(session)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate") 
      ? new Date(searchParams.get("startDate")!)
      : new Date(new Date().setDate(new Date().getDate() - 30)) // Últimos 30 dias por padrão
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : new Date()

    // Métricas gerais
    const [
      totalTransactions,
      totalAmount,
      successRate,
      methodDistribution,
      gatewayDistribution,
      dailyTransactions
    ] = await Promise.all([
      // Total de transações
      prisma.paymentTransaction.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }),

      // Valor total
      prisma.paymentTransaction.aggregate({
        where: {
          status: "PAID",
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { amount: true }
      }),

      // Taxa de sucesso
      prisma.paymentTransaction.groupBy({
        by: ["status"],
        where: { createdAt: { gte: startDate, lte: endDate } },
        _count: true
      }),

      // Distribuição por método de pagamento
      prisma.paymentTransaction.groupBy({
        by: ["paymentMethod"],
        where: { createdAt: { gte: startDate, lte: endDate } },
        _count: true
      }),

      // Distribuição por gateway
      prisma.paymentTransaction.groupBy({
        by: ["gatewayConfigId"],
        where: { createdAt: { gte: startDate, lte: endDate } },
        _count: true,
        orderBy: { _count: { gatewayConfigId: "desc" } }
      }),

      // Transações diárias
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) as paid,
          SUM(CASE WHEN status = 'PAID' THEN amount::numeric ELSE 0 END) as amount
        FROM "PaymentTransaction"
        WHERE created_at >= ${startDate} AND created_at <= ${endDate}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `
    ])

    // Calcular taxa de sucesso
    const totalCount = successRate.reduce((acc, curr) => acc + curr._count, 0)
    const successCount = successRate.find(r => r.status === "PAID")?._count || 0
    const calculatedSuccessRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0

    // Buscar nomes dos gateways
    const gatewayNames = await prisma.paymentGatewayConfig.findMany({
      where: {
        id: {
          in: gatewayDistribution.map(g => g.gatewayConfigId)
        }
      },
      select: {
        id: true,
        name: true
      }
    })

    // Formatar distribuição por gateway com nomes
    const formattedGatewayDistribution = gatewayDistribution.map(g => ({
      gateway: gatewayNames.find(n => n.id === g.gatewayConfigId)?.name || g.gatewayConfigId,
      count: g._count
    }))

    return NextResponse.json({
      period: {
        startDate,
        endDate
      },
      overview: {
        totalTransactions,
        totalAmount: totalAmount._sum.amount || 0,
        successRate: calculatedSuccessRate
      },
      distribution: {
        byMethod: methodDistribution,
        byGateway: formattedGatewayDistribution
      },
      dailyMetrics: dailyTransactions
    })
  } catch (error) {
    console.error("Erro ao gerar relatório:", error)
    return NextResponse.json(
      { error: "Erro ao gerar relatório" },
      { status: 500 }
    )
  }
}
