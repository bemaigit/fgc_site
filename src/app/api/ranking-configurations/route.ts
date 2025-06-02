import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

type RankingConfigurationWithRelations = {
  id: string
  name: string
  modalityId: string
  categoryId: string
  gender: string
  season: number
  active: boolean
  createdAt: Date
  updatedAt: Date
  RankingModality: { name: string }
  RankingCategory: { name: string }
  RankingEntry: Array<{
    Athlete: {
      fullName: string
    }
  }>
}

const createRankingConfigSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  modality: z.string().min(1, 'Modalidade é obrigatória'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  gender: z.enum(['MALE', 'FEMALE'], { 
    errorMap: () => ({ message: 'Gênero deve ser MALE ou FEMALE' }) 
  }),
  season: z.number().int().min(2000).max(2100)
})

const rankingConfigQuerySchema = z.object({
  modality: z.string().optional(),
  category: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  season: z.coerce.number().optional(),
  active: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10)
})

// GET - Listar configurações de ranking
export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams
  
  try {
    const params = rankingConfigQuerySchema.parse({
      modality: searchParams.get('modality') || undefined,
      category: searchParams.get('category') || undefined,
      gender: searchParams.get('gender') || undefined,
      season: searchParams.get('season') ? parseInt(searchParams.get('season')!) : undefined,
      active: searchParams.get('active') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10')
    })

    const skip = (params.page - 1) * params.limit

    // Buscar configurações
    const configurations = await prisma.rankingConfiguration.findMany({
      where: {
        RankingModality: params.modality ? {
          name: {
            equals: params.modality
          }
        } : undefined,
        RankingCategory: params.category ? {
          name: {
            equals: params.category
          }
        } : undefined,
        gender: params.gender,
        season: params.season,
        active: params.active === 'true' ? true : params.active === 'false' ? false : undefined
      },
      include: {
        RankingModality: true,
        RankingCategory: true,
        RankingEntry: {
          include: {
            Athlete: true
          },
          orderBy: {
            points: 'desc'
          },
          take: 1
        }
      },
      skip,
      take: params.limit,
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Contar total
    const total = await prisma.rankingConfiguration.count({
      where: {
        RankingModality: params.modality ? {
          name: {
            equals: params.modality
          }
        } : undefined,
        RankingCategory: params.category ? {
          name: {
            equals: params.category
          }
        } : undefined,
        gender: params.gender,
        season: params.season,
        active: params.active === 'true' ? true : params.active === 'false' ? false : undefined
      }
    })

    return NextResponse.json({
      data: configurations.map((config) => ({
        id: config.id,
        name: config.name,
        modality: config.RankingModality.name,
        category: config.RankingCategory.name,
        gender: config.gender,
        season: config.season,
        active: config.active,
        createdAt: config.createdAt.toISOString(),
        updatedAt: config.updatedAt.toISOString(),
        championName: config.RankingEntry[0]?.Athlete.fullName
      })),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar configurações de ranking:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro ao buscar configurações de ranking',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// POST - Criar nova configuração de ranking
export async function POST(request: Request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se é admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem criar configurações de ranking.' },
        { status: 403 }
      )
    }

    // Validar dados
    const body = await request.json()
    const data = createRankingConfigSchema.parse(body)

    // Verificar se modalidade existe
    const modality = await prisma.rankingModality.findUnique({
      where: { name: data.modality }
    })

    if (!modality) {
      return NextResponse.json(
        { error: 'Modalidade não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se categoria existe
    const category = await prisma.rankingCategory.findUnique({
      where: { 
        name_modalityId: {
          name: data.category,
          modalityId: modality.id
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada para esta modalidade' },
        { status: 404 }
      )
    }

    // Verificar se já existe configuração com mesma combinação
    const existingConfig = await prisma.rankingConfiguration.findFirst({
      where: {
        modalityId: modality.id,
        categoryId: category.id,
        gender: data.gender,
        season: data.season
      }
    })

    if (existingConfig) {
      return NextResponse.json(
        { error: 'Já existe um ranking com esta combinação de modalidade, categoria, gênero e temporada' },
        { status: 409 }
      )
    }

    // Criar configuração de ranking
    const configuration = await prisma.rankingConfiguration.create({
      data: {
        id: uuidv4(),
        name: `${data.modality} - ${data.category} (${data.gender === 'MALE' ? 'Masculino' : 'Feminino'})`,
        modalityId: modality.id,
        categoryId: category.id,
        gender: data.gender,
        season: data.season,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        RankingModality: true,
        RankingCategory: true
      }
    })

    return NextResponse.json({
      data: {
        id: configuration.id,
        name: configuration.name,
        modality: configuration.RankingModality.name,
        category: configuration.RankingCategory.name,
        gender: configuration.gender,
        season: configuration.season,
        active: configuration.active,
        createdAt: configuration.createdAt.toISOString(),
        updatedAt: configuration.updatedAt.toISOString()
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar configuração de ranking:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Dados inválidos',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro ao criar configuração de ranking'
    }, { status: 500 })
  }
}
