import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Rota para atualizar um atleta no ranking
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verifica se é admin ou super_admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem atualizar atletas.' },
        { status: 403 }
      )
    }

    const id = params.id 
    const data = await request.json()
    
    console.log('Atualizando entrada de ranking:', id, data)
    
    // Verifica se a entrada de ranking existe
    const rankingEntry = await prisma.rankingEntry.findUnique({
      where: { id },
      include: {
        Athlete: true,
        RankingConfiguration: {
          include: {
            RankingModality: true,
            RankingCategory: true
          }
        }
      }
    })
    
    if (!rankingEntry) {
      console.error(`Entrada de ranking não encontrada: ${id}`)
      return NextResponse.json(
        { error: 'Entrada de ranking não encontrada' },
        { status: 404 }
      )
    }
    
    // Atualiza os dados da entrada de ranking
    const updatedEntry = await prisma.rankingEntry.update({
      where: { id },
      data: {
        points: data.points !== undefined ? Number(data.points) : rankingEntry.points,
        team: data.team,
        city: data.city || rankingEntry.city,
        updatedAt: new Date()
      }
    })
    
    // Se o nome foi atualizado, atualiza o registro do atleta também
    if (data.name && rankingEntry.Athlete) {
      await prisma.athlete.update({
        where: { id: rankingEntry.athleteId },
        data: {
          fullName: data.name,
          city: data.city || rankingEntry.Athlete.city,
          active: data.active !== undefined ? data.active : rankingEntry.Athlete.active,
          updatedAt: new Date()
        }
      })
    }
    
    // Busca os dados atualizados para retornar
    const updatedRankingEntry = await prisma.rankingEntry.findUnique({
      where: { id },
      include: {
        Athlete: true,
        RankingConfiguration: {
          include: {
            RankingModality: true,
            RankingCategory: true
          }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        id: updatedRankingEntry?.id,
        name: updatedRankingEntry?.Athlete?.fullName,
        modality: updatedRankingEntry?.RankingConfiguration?.RankingModality?.name,
        category: updatedRankingEntry?.RankingConfiguration?.RankingCategory?.name,
        gender: updatedRankingEntry?.RankingConfiguration?.gender,
        city: updatedRankingEntry?.city,
        team: updatedRankingEntry?.team,
        points: updatedRankingEntry?.points,
        position: updatedRankingEntry?.position,
        athleteId: updatedRankingEntry?.athleteId,
        active: updatedRankingEntry?.Athlete?.active
      }
    })
  } catch (error) {
    console.error('Erro ao atualizar atleta:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar atleta' },
      { status: 500 }
    )
  }
}

// Rota para excluir um atleta
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verifica se é admin ou super_admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem excluir atletas.' },
        { status: 403 }
      )
    }

    const id = params.id 
    
    // Verifica se a entrada de ranking existe
    const rankingEntry = await prisma.rankingEntry.findUnique({
      where: { id }
    })
    
    if (!rankingEntry) {
      return NextResponse.json(
        { error: 'Entrada de ranking não encontrada' },
        { status: 404 }
      )
    }
    
    // Exclui a entrada de ranking
    await prisma.rankingEntry.delete({
      where: { id }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Entrada de ranking excluída com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir entrada de ranking:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir entrada de ranking' },
      { status: 500 }
    )
  }
}
