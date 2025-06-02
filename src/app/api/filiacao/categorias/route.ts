import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    console.log('Iniciando busca de categorias...')
    
    // Verificar parâmetros da consulta
    const { searchParams } = new URL(request.url);
    const includeModality = searchParams.get('includeModality') === 'true';
    const modalityId = searchParams.get('modalityId');
    
    // Buscar categorias baseado nos parâmetros
    let categorias;
    
    if (modalityId) {
      // Buscar categorias de uma modalidade específica usando SQL
      categorias = await prisma.$queryRaw`
        SELECT fc.* 
        FROM "FiliationCategory" fc
        JOIN "ModalityToCategory" mtc ON fc.id = mtc."categoryId"
        WHERE mtc."modalityId" = ${modalityId}
        AND fc.active = true
        ORDER BY fc."order" ASC
      `;
      
    } else if (includeModality) {
      // Buscar todas as categorias com suas modalidades
      const result = await prisma.$queryRaw`
        SELECT 
          fc.id, 
          fc.name, 
          fc.active, 
          fc."order", 
          fc."createdAt", 
          fc."updatedAt",
          fc."createdBy",
          fc."updatedBy",
          json_agg(
            json_build_object(
              'id', fm.id, 
              'name', fm.name
            )
          ) FILTER (WHERE fm.id IS NOT NULL) as modalities
        FROM "FiliationCategory" fc
        LEFT JOIN "ModalityToCategory" mtc ON fc.id = mtc."categoryId"
        LEFT JOIN "FiliationModality" fm ON mtc."modalityId" = fm.id
        WHERE fc.active = true
        GROUP BY fc.id
        ORDER BY fc."order" ASC
      `;
      
      // Tratar casos em que não há modalidades (null)
      categorias = (result as any[]).map(cat => ({
        ...cat,
        modalities: cat.modalities || []
      }));
      
    } else {
      // Buscar todas as categorias sem modalidades
      categorias = await prisma.$queryRaw`
        SELECT * FROM "FiliationCategory"
        WHERE active = true
        ORDER BY "order" ASC
      `;
    }
    
    return NextResponse.json(categorias);
    

  } catch (error: any) {
    console.error('Erro ao buscar categorias:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar categorias: ' + error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validar campos
    if (!body.name || body.order === undefined) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }
    
    // Extrair IDs de modalidades da solicitação
    const modalityIds = Array.isArray(body.modalityIds) ? body.modalityIds : [];
    
    // Gerar ID se não fornecido
    const categoryId = body.id || crypto.randomUUID();
    const now = new Date();
    
    // Criar a categoria usando SQL
    await prisma.$executeRaw`
      INSERT INTO "FiliationCategory" (id, name, active, "order", "createdAt", "updatedAt", "createdBy", "updatedBy")
      VALUES (
        ${categoryId}, 
        ${body.name}, 
        ${body.active}, 
        ${body.order}, 
        ${now}, 
        ${now}, 
        ${session.user.id}, 
        ${session.user.id}
      )
    `;
    
    // Se houver modalidades, criar as relações
    if (modalityIds.length > 0) {
      for (const modalityId of modalityIds) {
        await prisma.$executeRaw`
          INSERT INTO "ModalityToCategory" ("modalityId", "categoryId")
          VALUES (${modalityId}, ${categoryId})
        `;
      }
    }
    
    // Buscar a categoria criada com suas modalidades
    const result = await prisma.$queryRaw`
      SELECT 
        fc.id, 
        fc.name, 
        fc.active, 
        fc."order", 
        fc."createdAt", 
        fc."updatedAt",
        fc."createdBy",
        fc."updatedBy",
        json_agg(
          json_build_object(
            'id', fm.id, 
            'name', fm.name
          )
        ) FILTER (WHERE fm.id IS NOT NULL) as modalities
      FROM "FiliationCategory" fc
      LEFT JOIN "ModalityToCategory" mtc ON fc.id = mtc."categoryId"
      LEFT JOIN "FiliationModality" fm ON mtc."modalityId" = fm.id
      WHERE fc.id = ${categoryId}
      GROUP BY fc.id
    `;
    
    // Processar resultado
    const categoria = (result as any[])[0];
    categoria.modalities = categoria.modalities || [];
    
    return NextResponse.json(categoria);
  } catch (error: any) {
    console.error('Erro ao criar categoria:', error);
    return NextResponse.json(
      { error: 'Erro ao criar categoria: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Verificar se a categoria existe
    const existingCategory = await prisma.$queryRaw`
      SELECT id FROM "FiliationCategory" WHERE id = ${body.id}
    `;
    
    if (!existingCategory || (Array.isArray(existingCategory) && existingCategory.length === 0)) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }
    
    // Extrair IDs de modalidades da solicitação
    const modalityIds = Array.isArray(body.modalityIds) ? body.modalityIds : [];
    const now = new Date();
    
    // Atualizar a categoria usando SQL
    await prisma.$executeRaw`
      UPDATE "FiliationCategory"
      SET 
        name = ${body.name},
        active = ${body.active},
        "order" = ${body.order},
        "updatedAt" = ${now},
        "updatedBy" = ${session.user.id}
      WHERE id = ${body.id}
    `;
    
    // Remover todas as relações existentes
    await prisma.$executeRaw`
      DELETE FROM "ModalityToCategory"
      WHERE "categoryId" = ${body.id}
    `;
    
    // Adicionar as novas relações
    if (modalityIds.length > 0) {
      for (const modalityId of modalityIds) {
        await prisma.$executeRaw`
          INSERT INTO "ModalityToCategory" ("modalityId", "categoryId")
          VALUES (${modalityId}, ${body.id})
        `;
      }
    }
    
    // Buscar a categoria atualizada com suas modalidades
    const result = await prisma.$queryRaw`
      SELECT 
        fc.id, 
        fc.name, 
        fc.active, 
        fc."order", 
        fc."createdAt", 
        fc."updatedAt",
        fc."createdBy",
        fc."updatedBy",
        json_agg(
          json_build_object(
            'id', fm.id, 
            'name', fm.name
          )
        ) FILTER (WHERE fm.id IS NOT NULL) as modalities
      FROM "FiliationCategory" fc
      LEFT JOIN "ModalityToCategory" mtc ON fc.id = mtc."categoryId"
      LEFT JOIN "FiliationModality" fm ON mtc."modalityId" = fm.id
      WHERE fc.id = ${body.id}
      GROUP BY fc.id
    `;
    
    // Processar resultado
    const categoria = (result as any[])[0];
    categoria.modalities = categoria.modalities || [];
    
    return NextResponse.json(categoria);
  } catch (error: any) {
    console.error('Erro ao atualizar categoria:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar categoria: ' + error.message },
      { status: 500 }
    );
  }
}

// Endpoint adicional para buscar categorias por modalidade
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { modalityIds } = body;
    
    console.log('Buscando categorias para modalidades:', modalityIds);
    
    if (!modalityIds || !Array.isArray(modalityIds) || modalityIds.length === 0) {
      console.log('Nenhuma modalidade fornecida, retornando lista vazia');
      return NextResponse.json([]);
    }
    
    // Debugar os ids recebidos antes de fazer a consulta
    console.log('IDs de modalidades recebidos:', JSON.stringify(modalityIds));
    
    // Transformar os IDs em um formato que pode ser seguramente usado na consulta SQL
    // Isso evita SQL injection e garante que a comparação seja feita corretamente
    const placeholders = modalityIds.map((_, i) => `$${i + 1}`).join(',');
    
    // Buscar categorias relacionadas às modalidades de forma segura usando parâmetros posicionais
    const categorias = await prisma.$queryRaw(
      Prisma.sql`
        SELECT DISTINCT fc.*
        FROM "FiliationCategory" fc
        JOIN "ModalityToCategory" mtc ON fc.id = mtc."categoryId"
        WHERE mtc."modalityId" IN (${Prisma.raw(placeholders)}) 
        AND fc.active = true
        ORDER BY fc."order" ASC
      `,
      ...modalityIds
    );
    
    console.log(`Filtradas ${Array.isArray(categorias) ? categorias.length : 0} categorias para as modalidades selecionadas`);
    
    return NextResponse.json(categorias);
  } catch (error: any) {
    console.error('Erro ao buscar categorias por modalidades:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar categorias: ' + error.message },
      { status: 500 }
    );
  }
}
