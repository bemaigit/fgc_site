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

    // Buscar participações do atleta em campeonatos no ano selecionado
    const championEntries = await prisma.championEntry.findMany({
      where: {
        athleteId,
        ChampionshipEvent: {
          year
        }
      },
      include: {
        ChampionshipEvent: {
          select: {
            id: true,
            name: true,
            year: true,
            description: true
          }
        }
      },
      orderBy: {
        position: 'asc'
      }
    })

    // Formatar dados para resposta
    const formattedChampions = championEntries.map(entry => {
      // Usar diretamente o ID da categoria e modalidade, ou buscar relacionamentos se necessário
      return {
        id: entry.id,
        eventId: entry.ChampionshipEvent.id,
        eventName: entry.ChampionshipEvent.name,
        position: entry.position,
        category: entry.categoryId, // Usamos o ID diretamente
        modality: entry.modalityId, // Usamos o ID diretamente
        year: entry.ChampionshipEvent.year
      }
    })

    return NextResponse.json(formattedChampions)
  } catch (error) {
    console.error("Erro ao buscar dados de campeonatos:", error)
    return NextResponse.json(
      { error: "Erro ao buscar dados de campeonatos" },
      { status: 500 }
    )
  }
}
