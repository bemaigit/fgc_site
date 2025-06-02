import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// Schema de validação para atualizar campeão
const updateChampionSchema = z.object({
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

// GET - Obter detalhes de um campeão específico
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    
    // Buscar o campeão pelo ID
    const champion = await prisma.champion.findUnique({
      where: { id },
      include: {
        Athlete: true
      }
    })
    
    if (!champion) {
      return NextResponse.json(
        { error: 'Campeão não encontrado' },
        { status: 404 }
      )
    }
    
    // Formatar resposta
    const formattedChampion = {
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
    }
    
    return NextResponse.json(formattedChampion)
  } catch (error: unknown) {
    console.error(`Erro ao buscar campeão ${params.id}:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Erro ao buscar detalhes do campeão', details: errorMessage },
      { status: 500 }
    )
  }
}

// PUT - Atualizar um campeão existente
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    const id = params.id
    
    // Verificar se o campeão existe
    const existingChampion = await prisma.champion.findUnique({
      where: { id }
    })
    
    if (!existingChampion) {
      return NextResponse.json(
        { error: 'Campeão não encontrado' },
        { status: 404 }
      )
    }
    
    // Obter dados do request
    const data = await request.json()
    
    // Validar dados
    const validatedData = updateChampionSchema.parse(data)
    
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
    
    // Verificar se já existe outro campeão para esta combinação (excluindo o atual)
    const duplicateChampion = await prisma.champion.findFirst({
      where: {
        id: { not: id },
        modality: validatedData.modality,
        category: validatedData.category,
        gender: validatedData.gender,
        year: validatedData.year,
        position: validatedData.position
      }
    })
    
    if (duplicateChampion) {
      return NextResponse.json(
        { 
          error: 'Já existe um campeão para esta modalidade, categoria, gênero e ano com a mesma posição' 
        },
        { status: 409 }
      )
    }
    
    // Atualizar campeão
    const updatedChampion = await prisma.champion.update({
      where: { id },
      data: validatedData,
      include: {
        Athlete: true
      }
    })
    
    // Formatar resposta
    const formattedChampion = {
      id: updatedChampion.id,
      athleteId: updatedChampion.athleteId,
      modality: updatedChampion.modality,
      category: updatedChampion.category,
      gender: updatedChampion.gender,
      position: updatedChampion.position,
      city: updatedChampion.city,
      team: updatedChampion.team,
      year: updatedChampion.year,
      createdAt: updatedChampion.createdAt.toISOString(),
      athlete: {
        id: updatedChampion.Athlete.id,
        fullName: updatedChampion.Athlete.fullName,
        image: null // Não existe a propriedade image no modelo Athlete
      }
    }
    
    return NextResponse.json(formattedChampion)
  } catch (error: unknown) {
    console.error(`Erro ao atualizar campeão ${params.id}:`, error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Erro ao atualizar campeão', details: errorMessage },
      { status: 500 }
    )
  }
}

// DELETE - Excluir um campeão
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    const id = params.id
    
    // Verificar se o campeão existe
    const existingChampion = await prisma.champion.findUnique({
      where: { id }
    })
    
    if (!existingChampion) {
      return NextResponse.json(
        { error: 'Campeão não encontrado' },
        { status: 404 }
      )
    }
    
    // Excluir o campeão
    await prisma.champion.delete({
      where: { id }
    })
    
    return NextResponse.json(
      { message: 'Campeão excluído com sucesso' },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error(`Erro ao excluir campeão ${params.id}:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Erro ao excluir campeão', details: errorMessage },
      { status: 500 }
    )
  }
}
