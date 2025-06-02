import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/events/categories/modalities
 * 
 * Retorna todas as relações entre categorias e modalidades
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar todas as relações entre categorias e modalidades
    const relations = await (prisma as any).EventModalityToCategory.findMany({
      select: {
        categoryId: true,
        modalityId: true
      }
    })

    return NextResponse.json(relations)
  } catch (error) {
    console.error('Erro ao buscar relações entre categorias e modalidades:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
