import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

interface RankingEntryWithAthlete {
  id: string
  configurationId: string
  athleteId: string
  points: number
  position: number
  city: string
  team: string | null
  createdAt: Date
  updatedAt: Date
  fullName: string
  modality: string
  category: string
  gender: string
  season: number
}

const rankingEntriesQuerySchema = z.object({
  modality: z.string(),
  category: z.string(),
  gender: z.enum(['MALE', 'FEMALE']),
  season: z.coerce.number().optional(),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10)
})

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams
  
  try {
    const params = rankingEntriesQuerySchema.parse({
      modality: searchParams.get('modality'),
      category: searchParams.get('category'),
      gender: searchParams.get('gender'),
      season: searchParams.get('season') ? parseInt(searchParams.get('season')!) : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10')
    })

    const skip = (params.page - 1) * params.limit

    // Buscar entradas do ranking com a configuração e atleta
    const entries = await prisma.$queryRaw<RankingEntryWithAthlete[]>`
      SELECT 
        re.*,
        a."fullName",
        rm.name as modality,
        rc.name as category,
        conf.gender,
        conf.season
      FROM "RankingEntry" re
      JOIN "RankingConfiguration" conf ON re."configurationId" = conf.id
      JOIN "RankingModality" rm ON conf."modalityId" = rm.id
      JOIN "RankingCategory" rc ON conf."categoryId" = rc.id
      LEFT JOIN "Athlete" a ON re."athleteId" = a.id
      WHERE rm.name = ${params.modality}
        AND rc.name = ${params.category}
        AND conf.gender = ${params.gender}
        AND (${params.season}::int IS NULL OR conf.season = ${params.season})
      ORDER BY re.points DESC, re.position ASC
      LIMIT ${params.limit}
      OFFSET ${skip}
    `

    // Contar total de registros
    const countResult = await prisma.$queryRaw<[{ count: string }]>`
      SELECT COUNT(*) as count
      FROM "RankingEntry" re
      JOIN "RankingConfiguration" conf ON re."configurationId" = conf.id
      JOIN "RankingModality" rm ON conf."modalityId" = rm.id
      JOIN "RankingCategory" rc ON conf."categoryId" = rc.id
      WHERE rm.name = ${params.modality}
        AND rc.name = ${params.category}
        AND conf.gender = ${params.gender}
        AND (${params.season}::int IS NULL OR conf.season = ${params.season})
    `

    const count = Number(countResult[0].count)

    // Formatar resposta
    return NextResponse.json({
      data: entries.map(entry => ({
        id: entry.id,
        athleteId: entry.athleteId,
        modality: entry.modality,
        category: entry.category,
        gender: entry.gender,
        points: entry.points,
        position: entry.position,
        city: entry.city,
        team: entry.team,
        season: entry.season,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
        athlete: {
          id: entry.athleteId,
          fullName: entry.fullName
        }
      })),
      pagination: {
        page: params.page,
        limit: params.limit,
        total: count,
        totalPages: Math.ceil(count / params.limit)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar entradas de ranking:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro ao buscar entradas de ranking',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
