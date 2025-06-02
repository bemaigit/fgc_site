import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Endpoint extremamente simples
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { modalityIds } = body;
    
    console.log('Buscando categorias para:', modalityIds);
    
    if (!modalityIds || !Array.isArray(modalityIds) || modalityIds.length === 0) {
      return NextResponse.json([]);
    }
    
    // Usar método mais simples sem nenhuma complicação
    // SQL direto sem confiança em ORMs ou camadas de abstração
    const categorias = await prisma.$queryRawUnsafe(`
      SELECT DISTINCT fc.*
      FROM "FiliationCategory" fc
      JOIN "ModalityToCategory" mtc ON fc.id = mtc."categoryId"
      WHERE mtc."modalityId" IN (${modalityIds.map(id => `'${id}'`).join(',')})
      AND fc.active = true
      ORDER BY fc."order" ASC
    `);
    
    console.log(`SQL retornou ${categorias.length} categorias`);
    
    return NextResponse.json(categorias);
  } catch (error: any) {
    console.error('Erro SQL:', error);
    return NextResponse.json([]);
  }
}
