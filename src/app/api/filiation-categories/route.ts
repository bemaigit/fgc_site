import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const modalityId = searchParams.get('modalityId')
    
    // Usar query básica para evitar problemas de tipo
    const whereClause: any = { active: true }
    if (modalityId) {
      whereClause.modalityId = modalityId
    }
    
    const categories = await prisma.filiationCategory.findMany({
      where: whereClause,
      orderBy: { order: 'asc' }
    })
    
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Erro ao buscar categorias de filiação:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar categorias de filiação' },
      { status: 500 }
    )
  }
}
