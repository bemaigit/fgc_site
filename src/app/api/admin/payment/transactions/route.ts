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

// GET - Listar transações com filtros
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!await checkAdminPermission(session)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const entityType = searchParams.get("entityType")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Construir where clause baseado nos filtros
    const where: any = {}
    if (status) where.status = status
    if (entityType) where.entityType = entityType
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    // Buscar transações
    const [transactions, total] = await Promise.all([
      prisma.paymentTransaction.findMany({
        where,
        include: {
          gatewayConfig: {
            select: {
              name: true,
              provider: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.paymentTransaction.count({ where })
    ])

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Erro ao listar transações:", error)
    return NextResponse.json(
      { error: "Erro ao listar transações" },
      { status: 500 }
    )
  }
}

// GET - Obter detalhes de uma transação específica
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!await checkAdminPermission(session)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await request.json()

    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id },
      include: {
        gatewayConfig: {
          select: {
            name: true,
            provider: true
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: "Transação não encontrada" },
        { status: 404 }
      )
    }

    // Buscar detalhes da entidade relacionada
    let entityDetails = null
    switch (transaction.entityType) {
      case "ATHLETE":
        entityDetails = await prisma.athlete.findUnique({
          where: { id: transaction.entityId },
          select: {
            fullName: true,
            cpf: true,
            email: true
          }
        })
        break
      case "CLUB":
        entityDetails = await prisma.club.findUnique({
          where: { id: transaction.entityId },
          select: {
            clubName: true,
            cnpj: true,
            email: true
          }
        })
        break
      // Adicionar outros tipos conforme necessário
    }

    return NextResponse.json({
      ...transaction,
      entityDetails
    })
  } catch (error) {
    console.error("Erro ao obter detalhes da transação:", error)
    return NextResponse.json(
      { error: "Erro ao obter detalhes da transação" },
      { status: 500 }
    )
  }
}
