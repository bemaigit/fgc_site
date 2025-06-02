import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { Prisma } from '@prisma/client'
import { storageService } from '@/lib/storage'

// Função para processar URLs de imagens
function processImageUrl(imageUrl: string): string {
  if (!imageUrl) return '';
  
  // Se já for uma URL relativa ou processada, retorna como está
  if (imageUrl.startsWith('/storage/') || imageUrl.startsWith('/images/')) {
    return imageUrl;
  }
  
  try {
    // Extrai o caminho da URL original do MinIO (remove http://localhost:9000/)
    let path = imageUrl;
    
    // Remover protocolo e domínio se presente
    if (path.includes('://')) {
      // Pegar tudo após o domínio e a porta
      const parts = path.split('/');
      // Ignorar protocolo://domínio:porta e juntar o resto
      path = parts.slice(3).join('/');
    }
    
    // Garantir que espaços e caracteres especiais sejam codificados corretamente
    const encodedPath = path.split('/').map(part => encodeURIComponent(part)).join('/');
    
    console.log('Processando URL de avatar:', { original: imageUrl, processada: encodedPath });
    
    // Gerar URL diretamente sem usar storageService
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_BASE_URL) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL.replace(/[\[\]\(\)]/g, '').replace(/\/+$/, '');
      return `${baseUrl}/storage/${encodedPath}`;
    }
    
    return `/storage/${encodedPath}`;
  } catch (error) {
    console.error('Erro ao processar URL de avatar:', error);
    return imageUrl; // Fallback para a URL original em caso de erro
  }
}

// Definir o tipo para as entradas de ranking com relações
type RankingEntryWithRelations = {
  id: string
  athleteId: string
  configurationId: string
  points: number
  position: number
  city: string
  team: string | null
  createdAt: Date
  updatedAt: Date
  Athlete: {
    id: string
    fullName: string
    User_Athlete_userIdToUser: {
      image: string | null
    }
  }
  RankingConfiguration: {
    id: string
    gender: 'MALE' | 'FEMALE'
    season: number
    RankingModality: {
      id: string
      name: string
    }
    RankingCategory: {
      id: string
      name: string
    }
  }
}

// Schema de validação para criação de ranking
const createRankingSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  modalityId: z.string().uuid('ID de modalidade inválido'),
  categoryId: z.string().uuid('ID de categoria inválido'),
  gender: z.enum(['MALE', 'FEMALE'], {
    errorMap: () => ({ message: 'Gênero deve ser MALE ou FEMALE' })
  }),
  season: z.number().int().min(2000, 'Temporada inválida')
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const type = url.searchParams.get('type')
  
  // Se o tipo for 'categories', redirecionamos para a lógica de listagem de categorias
  if (type === 'categories') {
    return handleCategoryListing()
  }
  
  try {
    console.log('Buscando rankings')
    
    // Pega os parâmetros da URL
    const modality = url.searchParams.get('modality')
    const category = url.searchParams.get('category')
    const gender = url.searchParams.get('gender')
    const season = url.searchParams.get('season')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    console.log('Filtros recebidos:', { modality, category, gender, season, page, limit })
    
    // Primeiro encontra a configuração de ranking correspondente
    const rankingConfig = await prisma.rankingConfiguration.findFirst({
      where: {
        RankingModality: {
          name: modality || undefined
        },
        RankingCategory: {
          name: category || undefined
        },
        gender: gender === 'FEMALE' ? { in: ['FEMALE', 'FEMININO'] } : gender || undefined,
        season: season ? parseInt(season) : undefined,
        active: true
      },
      include: {
        RankingModality: true,
        RankingCategory: true
      }
    })

    if (!rankingConfig) {
      console.log('Nenhuma configuração de ranking encontrada')
      return new Response(JSON.stringify({ 
        data: [],
        pagination: {
          total: 0,
          totalPages: 0,
          page: page,
          limit: limit
        }
      }))
    }

    // Depois busca as entradas de ranking usando o ID da configuração
    const [entriesResult, total] = await Promise.all([
      prisma.rankingEntry.findMany({
        where: {
          configurationId: rankingConfig.id
        },
        skip,
        take: limit,
        orderBy: {
          points: 'desc'
        },
        include: {
          Athlete: {
            include: {
              User_Athlete_userIdToUser: {
                select: {
                  image: true
                }
              }
            }
          },
          RankingConfiguration: {
            include: {
              RankingModality: true,
              RankingCategory: true
            }
          }
        }
      }),
      prisma.rankingEntry.count({
        where: {
          configurationId: rankingConfig.id
        }
      })
    ])

    // Converter para o tipo correto
    const entries = entriesResult as unknown as RankingEntryWithRelations[]

    console.log(`Encontrados ${entries.length} rankings`)

    // Formata a resposta
    const formattedEntries = entries.map(entry => ({
      id: entry.id,
      athleteId: entry.athleteId,
      modality: entry.RankingConfiguration.RankingModality.name,
      category: entry.RankingConfiguration.RankingCategory.name,
      gender: entry.RankingConfiguration.gender,
      points: entry.points,
      position: entry.position,
      city: entry.city,
      team: entry.team,
      season: entry.RankingConfiguration.season,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
      athlete: {
        id: entry.Athlete.id,
        fullName: entry.Athlete.fullName,
        image: entry.Athlete.User_Athlete_userIdToUser?.image 
          ? processImageUrl(entry.Athlete.User_Athlete_userIdToUser.image)
          : null
      }
    }))

    return new Response(JSON.stringify({
      data: formattedEntries,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        page,
        limit
      }
    }))
  } catch (error) {
    console.error('Erro ao buscar rankings:', error instanceof Error ? error.message : 'Erro desconhecido')
    return NextResponse.json(
      { error: 'Erro ao buscar rankings' },
      { status: 500 }
    )
  }
}

// Função para lidar com a listagem de categorias
async function handleCategoryListing() {
  try {
    const categories = await prisma.rankingCategory.findMany({
      where: {
        active: true
      },
      include: {
        RankingModality: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    const formattedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      modality: {
        id: category.RankingModality.id,
        name: category.RankingModality.name
      }
    }))

    return new Response(JSON.stringify(formattedCategories))
  } catch (error) {
    console.error('Erro ao buscar categorias:', error instanceof Error ? error.message : 'Erro desconhecido')
    return NextResponse.json(
      { error: 'Erro ao buscar categorias' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const type = new URL(request.url).searchParams.get('type')
  
  // Se o tipo for 'category', redirecionamos para a lógica de criação de categoria
  if (type === 'category') {
    return handleCategoryCreation(request)
  }
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    
    // Validar os dados recebidos
    const validationResult = createRankingSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }
    
    const { name, modalityId, categoryId, gender, season } = validationResult.data
    
    // Verificar se já existe uma configuração com esses parâmetros
    const existingConfig = await prisma.rankingConfiguration.findFirst({
      where: {
        modalityId,
        categoryId,
        gender,
        season
      }
    })
    
    if (existingConfig) {
      return NextResponse.json(
        { error: 'Já existe um ranking com esses parâmetros' },
        { status: 400 }
      )
    }
    
    // Criar a configuração de ranking
    const rankingConfig = await prisma.rankingConfiguration.create({
      data: {
        id: uuidv4(),
        name,
        modalityId,
        categoryId,
        gender,
        season,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        RankingModality: true,
        RankingCategory: true
      }
    })
    
    return NextResponse.json(rankingConfig)
  } catch (error) {
    console.error('Erro ao criar ranking:', error instanceof Error ? error.message : 'Erro desconhecido')
    return NextResponse.json(
      { error: 'Erro ao criar ranking' },
      { status: 500 }
    )
  }
}

// Função para lidar com a criação de categorias
async function handleCategoryCreation(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    
    // Validar os dados recebidos
    const categorySchema = z.object({
      name: z.string().min(1, 'Nome é obrigatório'),
      description: z.string().optional(),
      modalityId: z.string().uuid('ID de modalidade inválido')
    })
    
    try {
      const validationResult = categorySchema.parse(body)
      const { name, description, modalityId } = validationResult
      
      // Verificar se a modalidade existe
      const modality = await prisma.rankingModality.findUnique({
        where: {
          id: modalityId
        }
      })
      
      if (!modality) {
        return NextResponse.json(
          { error: 'Modalidade não encontrada' },
          { status: 404 }
        )
      }
      
      // Verificar se já existe uma categoria com esse nome para essa modalidade
      const existingCategory = await prisma.rankingCategory.findFirst({
        where: {
          name,
          modalityId
        }
      })
      
      if (existingCategory) {
        return NextResponse.json(
          { error: 'Já existe uma categoria com esse nome para essa modalidade' },
          { status: 400 }
        )
      }
      
      // Criar a categoria
      const category = await prisma.rankingCategory.create({
        data: {
          id: uuidv4(),
          name,
          description,
          modalityId,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          RankingModality: true
        }
      })
      
      return NextResponse.json({
        ...category,
        modality: {
          id: category.RankingModality.id,
          name: category.RankingModality.name
        }
      })
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error('Erro de validação:', validationError.errors)
        return NextResponse.json(
          { error: validationError.errors[0].message },
          { status: 400 }
        )
      }
      throw validationError
    }
  } catch (error) {
    console.error('Erro ao criar categoria:', error instanceof Error ? error.message : 'Erro desconhecido')
    return NextResponse.json(
      { error: 'Erro ao criar categoria' },
      { status: 500 }
    )
  }
}
