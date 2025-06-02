import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Listar todas as modalidades de campeões
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

    // Buscar todas as modalidades, ordenadas por nome
    const modalities = await prisma.championModality.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(modalities)
  } catch (error) {
    console.error('Erro ao buscar modalidades:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar modalidades' },
      { status: 500 }
    )
  }
}
