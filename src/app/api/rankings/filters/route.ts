import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Buscar modalidades da tabela RankingModality
    const modalities = await prisma.rankingModality.findMany({
      where: {
        active: true
      },
      select: {
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Buscar categorias da tabela RankingCategory com suas modalidades
    const categories = await prisma.rankingCategory.findMany({
      where: {
        active: true
      },
      select: {
        id: true,
        name: true,
        RankingModality: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        {
          RankingModality: {
            name: 'asc'
          }
        },
        {
          name: 'asc'
        }
      ]
    })

    // Opções de gênero são fixas
    const genders = [
      { value: 'MALE', label: 'Masculino' },
      { value: 'FEMALE', label: 'Feminino' }
    ]

    return NextResponse.json({
      modalities: modalities.map(m => ({
        value: m.name,
        label: m.name
      })),
      categories: categories.map(c => ({
        id: c.id,
        value: c.name,
        label: c.name,
        modalityName: c.RankingModality.name
      })),
      genders
    })
  } catch (error) {
    console.error('Erro ao buscar filtros:', error instanceof Error ? error.message : 'Erro desconhecido')
    return NextResponse.json(
      { error: 'Erro ao buscar filtros' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
