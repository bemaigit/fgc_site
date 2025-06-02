"use server"

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const athleteId = params.id
    
    // Verificar se o usuário tem permissão para ver esses dados
    // (Se for o próprio atleta ou um admin)
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      select: { userId: true }
    })

    if (!athlete) {
      return NextResponse.json(
        { error: "Atleta não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se é o próprio atleta ou um admin
    if (athlete.userId !== session.user.id && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado a ver esses dados" },
        { status: 403 }
      )
    }

    // Obter ano selecionado da query string
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // Buscar posições em rankings deste atleta no ano selecionado
    const rankingPositions = await prisma.rankingEntry.findMany({
      where: {
        athleteId,
        RankingConfiguration: {
          season: year
        }
      },
      include: {
        RankingConfiguration: {
          select: {
            id: true,
            name: true,
            season: true,
            categoryId: true
          }
        }
      },
      orderBy: {
        position: 'asc'
      }
    })

    // Formatar dados para resposta
    const formattedPositions = rankingPositions.map(entry => ({
      id: entry.id,
      rankingId: entry.configurationId,
      rankingName: entry.RankingConfiguration.name,
      position: entry.position,
      points: entry.points,
      category: entry.RankingConfiguration.categoryId,
      year: entry.RankingConfiguration.season
    }))

    return NextResponse.json(formattedPositions)
  } catch (error) {
    console.error("Erro ao buscar posições nos rankings:", error)
    return NextResponse.json(
      { error: "Erro ao buscar posições nos rankings" },
      { status: 500 }
    )
  }
}
