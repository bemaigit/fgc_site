import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const modalityId = searchParams.get('modalityId')
    
    if (!modalityId) {
      return NextResponse.json(
        { error: 'ID da modalidade é obrigatório' },
        { status: 400 }
      )
    }
    
    console.log('Buscando categorias para modalidade:', modalityId);
    
    // Nova consulta usando a tabela de junção ModalityToCategory
    const categories = await prisma.$queryRaw`
      SELECT DISTINCT fc.*
      FROM "FiliationCategory" fc
      JOIN "ModalityToCategory" mtc ON fc.id = mtc."categoryId"
      WHERE fc.active = true 
      AND mtc."modalityId" = ${modalityId}
      ORDER BY fc."order" ASC
    `;
    
    console.log(`Encontradas ${Array.isArray(categories) ? categories.length : 0} categorias para a modalidade`);
    
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Erro ao buscar categorias por modalidade:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar categorias por modalidade' },
      { status: 500 }
    )
  }
}
