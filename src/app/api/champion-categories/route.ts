import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Listar todas as categorias de campeões
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Verificar se o usuário está autenticado e é admin ou super_admin
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    // Obter parâmetros de consulta
    const searchParams = req.nextUrl.searchParams
    const modalityId = searchParams.get('modalityId')
    
    // Preparar o filtro
    const where: Record<string, any> = {}
    if (modalityId) {
      where.modalityId = modalityId
    }

    // Buscar categorias, possivelmente filtradas por modalidade
    const categories = await prisma.championCategory.findMany({
      where,
      orderBy: {
        name: 'asc'
      },
      include: {
        ChampionModality: true
      }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar categorias' },
      { status: 500 }
    )
  }
}
