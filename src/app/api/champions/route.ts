import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// Schema de validação para criar/atualizar campeão
const championSchema = z.object({
  id: z.string().uuid('ID inválido'),
  athleteId: z.string().uuid('ID de atleta inválido'),
  modality: z.string().min(1, 'Modalidade é obrigatória'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  gender: z.enum(['MALE', 'FEMALE'], {
    errorMap: () => ({ message: 'Gênero deve ser MALE ou FEMALE' })
  }),
  position: z.number().int().min(1, 'Posição deve ser maior que zero'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  team: z.string().optional().nullable(),
  year: z.number().int().min(2000, 'Ano inválido')
})

// GET - Listar campeões com filtros
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    
    // Parâmetros de filtro
    const modality = url.searchParams.get('modality')
    const category = url.searchParams.get('category')
    const gender = url.searchParams.get('gender')
    const year = url.searchParams.get('year') || new Date().getFullYear().toString()
    
    console.log('Buscando campeões com filtros:', { modality, category, gender, year })
    
    // Buscar campeões conforme filtros
    const champions = await prisma.champion.findMany({
      where: {
        modality: modality || undefined,
        category: category || undefined,
        gender: gender === 'FEMALE' ? { in: ['FEMALE', 'FEMININO'] } : gender || undefined,
        year: year ? parseInt(year) : undefined
      },
      include: {
        Athlete: true
      },
      orderBy: {
        position: 'asc'
      }
    })
    
    // Formatar dados para retorno
    const formattedChampions = champions.map(champion => ({
      id: champion.id,
      athleteId: champion.athleteId,
      modality: champion.modality,
      category: champion.category,
      gender: champion.gender,
      position: champion.position,
      city: champion.city,
      team: champion.team,
      year: champion.year,
      createdAt: champion.createdAt.toISOString(),
      athlete: {
        id: champion.Athlete.id,
        fullName: champion.Athlete.fullName,
        image: null // Não existe a propriedade image no modelo Athlete
      }
    }))
    
    return NextResponse.json(formattedChampions)
  } catch (error: unknown) {
    console.error('Erro ao buscar campeões:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Erro ao buscar campeões', details: errorMessage },
      { status: 500 }
    )
  }
}

// POST - Criar novo campeão
export async function POST(request: Request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    // Obter dados do request
    const data = await request.json()
    
    // Validar dados
    const validatedData = championSchema.parse(data)
    
    // Verificar se o atleta existe
    const athlete = await prisma.athlete.findUnique({
      where: { id: validatedData.athleteId }
    })
    
    if (!athlete) {
      return NextResponse.json(
        { error: 'Atleta não encontrado' },
        { status: 404 }
      )
    }
    
    // Verificar se já existe um campeão para esta combinação
    const existingChampion = await prisma.champion.findFirst({
      where: {
        modality: validatedData.modality,
        category: validatedData.category,
        gender: validatedData.gender,
        year: validatedData.year,
        position: validatedData.position
      }
    })
    
    if (existingChampion) {
      return NextResponse.json(
        { 
          error: 'Já existe um campeão para esta modalidade, categoria, gênero e ano com a mesma posição' 
        },
        { status: 409 }
      )
    }
    
    // Criar novo campeão
    const newChampion = await prisma.champion.create({
      data: validatedData,
      include: {
        Athlete: true
      }
    })
    
    // Formatar resposta
    const formattedChampion = {
      id: newChampion.id,
      athleteId: newChampion.athleteId,
      modality: newChampion.modality,
      category: newChampion.category,
      gender: newChampion.gender,
      position: newChampion.position,
      city: newChampion.city,
      team: newChampion.team,
      year: newChampion.year,
      createdAt: newChampion.createdAt.toISOString(),
      athlete: {
        id: newChampion.Athlete.id,
        fullName: newChampion.Athlete.fullName,
        image: null // Não existe a propriedade image no modelo Athlete
      }
    }
    
    return NextResponse.json(formattedChampion, { status: 201 })
  } catch (error: unknown) {
    console.error('Erro ao criar campeão:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Erro ao criar campeão', details: errorMessage },
      { status: 500 }
    )
  }
}
