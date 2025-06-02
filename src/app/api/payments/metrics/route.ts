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

// GET - Obter métricas de pagamento
export async function GET(request: Request) {
  try {
    console.log("Iniciando busca de métricas...")
    
    const session = await getServerSession(authOptions)
    console.log("Sessão:", session)
    
    if (!await checkAdminPermission(session)) {
      console.log("Usuário não autorizado")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Como ainda não temos transações, vamos retornar dados vazios
    const metrics = {
      overview: {
        totalTransactions: 0,
        totalAmount: 0,
        successRate: 0
      },
      byStatus: {
        pending: 0,
        processing: 0,
        paid: 0,
        failed: 0,
        refunded: 0,
        cancelled: 0
      },
      byGateway: {}
    }

    console.log("Métricas calculadas:", metrics)
    return NextResponse.json(metrics)
  } catch (error) {
    console.error("Erro detalhado ao obter métricas:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao obter métricas de pagamento" },
      { status: 500 }
    )
  }
}
