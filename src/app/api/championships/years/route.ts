import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Listar anos disponíveis de campeões
export async function GET(req: NextRequest) {
  try {
    // Parâmetros de consulta opcionais
    const searchParams = req.nextUrl.searchParams
    const gender = searchParams.get('gender')
    const modalityId = searchParams.get('modalityId')
    const categoryId = searchParams.get('categoryId')
    
    // Construir as condições da busca
    const where: {
      gender?: string | { in: string[] };
      modalityId?: string;
      categoryId?: string;
    } = {}
    
    // Filtrar por gênero se fornecido
    if (gender) {
      // Lidar com o caso especial do gênero feminino (pode ser 'FEMALE' ou 'FEMININO')
      if (gender === 'FEMALE') {
        where.gender = { in: ['FEMALE', 'FEMININO'] }
      } else {
        where.gender = gender
      }
    }
    
    // Filtrar por modalidade se fornecida
    if (modalityId) {
      where.modalityId = modalityId
    }
    
    // Filtrar por categoria se fornecida
    if (categoryId) {
      where.categoryId = categoryId
    }
    
    // Buscar eventos de campeonato que têm campeões registrados
    const entries = await prisma.championEntry.findMany({
      where,
      select: {
        ChampionshipEvent: {
          select: {
            year: true
          }
        }
      },
      distinct: ['eventId']
    })
    
    // Extrair anos únicos e ordenar
    const years = Array.from(
      new Set(
        entries
          .map(entry => entry.ChampionshipEvent?.year)
          .filter(year => year !== null && year !== undefined)
      )
    ).sort((a, b) => b - a) // Ordenar decrescente (mais recente primeiro)
    
    console.log(`Anos disponíveis (${gender || 'todos os gêneros'}):`, years)
    
    return NextResponse.json(years)
  } catch (error) {
    console.error('Erro ao obter anos disponíveis:', error)
    return NextResponse.json({ error: 'Erro ao obter anos disponíveis' }, { status: 500 })
  }
}
