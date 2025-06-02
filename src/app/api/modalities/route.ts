import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FiliationCategory } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeCategory = searchParams.get('includeCategory') === 'true';
    const categoryId = searchParams.get('categoryId');
    
    // Buscar modalidades com ou sem categorias
    let modalities;
    
    if (includeCategory) {
      if (categoryId) {
        // Buscar modalidades de uma categoria específica com SQL
        modalities = await prisma.$queryRaw`
          SELECT 
            fm.id, 
            fm.name, 
            fm.price, 
            fm.active, 
            fm."order", 
            fm."createdAt", 
            fm."updatedAt", 
            fm."createdBy", 
            fm."updatedBy",
            json_agg(
              json_build_object(
                'id', fc.id, 
                'name', fc.name
              )
            ) FILTER (WHERE fc.id IS NOT NULL) as categories
          FROM "FiliationModality" fm
          LEFT JOIN "ModalityToCategory" mtc ON fm.id = mtc."modalityId"
          LEFT JOIN "FiliationCategory" fc ON mtc."categoryId" = fc.id
          WHERE fm.active = true
          AND (${categoryId}::text IS NULL OR mtc."categoryId" = ${categoryId})
          GROUP BY fm.id
          ORDER BY fm."order" ASC
        `;
      } else {
        // Buscar todas as modalidades com suas categorias
        modalities = await prisma.$queryRaw`
          SELECT 
            fm.id, 
            fm.name, 
            fm.price, 
            fm.active, 
            fm."order", 
            fm."createdAt", 
            fm."updatedAt", 
            fm."createdBy", 
            fm."updatedBy",
            json_agg(
              json_build_object(
                'id', fc.id, 
                'name', fc.name
              )
            ) FILTER (WHERE fc.id IS NOT NULL) as categories
          FROM "FiliationModality" fm
          LEFT JOIN "ModalityToCategory" mtc ON fm.id = mtc."modalityId"
          LEFT JOIN "FiliationCategory" fc ON mtc."categoryId" = fc.id
          WHERE fm.active = true
          GROUP BY fm.id
          ORDER BY fm."order" ASC
        `;
      }
      
      // Processar resultado para garantir que categories sempre seja um array
      modalities = modalities.map((modality: any) => ({
        ...modality,
        categories: modality.categories || []
      }));
    } else {
      // Buscar modalidades sem incluir categorias
      modalities = await prisma.$queryRaw`
        SELECT * FROM "FiliationModality"
        WHERE active = true
        ORDER BY "order" ASC
      `;
    }
    
    return NextResponse.json(modalities);
  } catch (error: any) {
    console.error('Erro ao buscar modalidades:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar modalidades: ' + error.message },
      { status: 500 }
    );
  }
}

// Endpoint adicional para buscar modalidades por categoria
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { categoryIds } = body;
    
    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json([]);
    }
    
    // Buscar modalidades que pertencem a qualquer uma das categorias fornecidas
    const modalidades = await prisma.$queryRaw`
      SELECT DISTINCT fm.*
      FROM "FiliationModality" fm
      JOIN "ModalityToCategory" mtc ON fm.id = mtc."modalityId"
      WHERE mtc."categoryId" IN (${categoryIds.join(',')}) 
      AND fm.active = true
      ORDER BY fm."order" ASC
    `;
    
    return NextResponse.json(modalidades);
  } catch (error: any) {
    console.error('Erro ao buscar modalidades por categorias:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar modalidades: ' + error.message },
      { status: 500 }
    );
  }
}
