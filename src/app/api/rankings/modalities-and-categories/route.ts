import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RankingModality {
  name: string
  description: string | null
  active: boolean
}

interface RankingCategory {
  id: string
  name: string
  modality: string
  description: string | null
  active: boolean
}

export async function GET() {
  try {
    // Buscar modalidades que têm configurações de ranking ativas
    const modalities = await prisma.$queryRaw<RankingModality[]>`
      SELECT DISTINCT
        rm.name,
        rm.description,
        rm.active
      FROM "RankingModality" rm
      JOIN "RankingConfiguration" rc ON rc."modalityId" = rm.id
      WHERE rm.active = true AND rc.active = true
      ORDER BY rm.name ASC
    `

    // Buscar categorias que têm configurações de ranking ativas
    const categories = await prisma.$queryRaw<RankingCategory[]>`
      SELECT DISTINCT
        rc.id,
        rc.name,
        rm.name as modality,
        rc.description,
        rc.active
      FROM "RankingCategory" rc
      JOIN "RankingConfiguration" conf ON conf."categoryId" = rc.id
      JOIN "RankingModality" rm ON conf."modalityId" = rm.id
      WHERE rc.active = true AND rm.active = true AND conf.active = true
      ORDER BY rm.name ASC, rc.name ASC
    `

    console.log('Modalidades encontradas:', modalities.length)
    console.log('Categorias encontradas:', categories.length)

    return NextResponse.json({
      modalities,
      categories
    })
  } catch (error) {
    console.error('Erro ao buscar modalidades e categorias:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar modalidades e categorias de ranking' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
