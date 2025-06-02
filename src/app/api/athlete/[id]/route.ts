import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Buscar atleta no banco
    const athlete = await prisma.athlete.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        cpf: true,
        address: true,
        city: true,
        state: true,
        zipCode: true
      }
    })

    if (!athlete) {
      return NextResponse.json(
        { error: "Atleta não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se o usuário tem permissão
    const isOwner = athlete.id === session.user.id
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN"
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    return NextResponse.json(athlete)
  } catch (error) {
    console.error("Erro ao buscar dados do atleta:", error)
    return NextResponse.json(
      { error: "Erro ao buscar dados do atleta" },
      { status: 500 }
    )
  }
}
