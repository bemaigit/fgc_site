import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Buscar modalidades e categorias de campeões
export async function GET() {
  try {
    // Buscar todas as modalidades de campeões
    const modalities = await prisma.championModality.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    })

    // Buscar todas as categorias de campeões
    const categories = await prisma.championCategory.findMany({
      select: {
        id: true,
        name: true,
        modalityId: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    })

    // Adicionar modalidade nos objetos de categoria para facilitar a filtragem
    const categoriesWithModalityName = await Promise.all(
      categories.map(async (category) => {
        const modality = await prisma.championModality.findUnique({
          where: { id: category.modalityId },
          select: { name: true },
        })
        
        return {
          ...category,
          modality: modality?.name || '',
        }
      })
    )

    console.log('Modalidades e categorias de campeões carregadas:', {
      modalities: modalities.length,
      categories: categoriesWithModalityName.length
    })

    return NextResponse.json({
      modalities,
      categories: categoriesWithModalityName,
    })
  } catch (error) {
    console.error('Erro ao buscar modalidades e categorias de campeões:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar modalidades e categorias de campeões' },
      { status: 500 }
    )
  }
}
