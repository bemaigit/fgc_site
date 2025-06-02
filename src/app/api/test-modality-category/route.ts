import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    // 1. Contar quantas modalidades existem
    const modalitiesCount = await prisma.filiationModality.count({
      where: { active: true }
    });
    
    // 2. Contar quantas categorias existem
    const categoriesCount = await prisma.filiationCategory.count({
      where: { active: true }
    });
    
    // 3. Buscar todas as modalidades com suas categorias
    const modalities = await prisma.filiationModality.findMany({
      where: { active: true },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    
    // 4. Calcular modalidades que têm pelo menos uma categoria
    const modalitiesWithCategories = modalities.filter(m => m.categories.length > 0).length;
    
    // 5. Contar relações na tabela de junção
    const relationCount = await prisma.modalityToCategory.count();
    
    // 6. Criar um mapa das relações para depuração
    const modalityRelations = modalities.map(m => ({
      id: m.id,
      name: m.name,
      categoryCount: m.categories.length,
      categories: m.categories.map(c => ({
        id: c.category.id,
        name: c.category.name
      }))
    }));
    
    return NextResponse.json({
      totalModalities: modalitiesCount,
      totalCategories: categoriesCount,
      totalRelations: relationCount,
      modalitiesWithCategories,
      modalityRelations
    });
  } catch (error: any) {
    console.error('Erro ao testar relações:', error);
    return NextResponse.json(
      { error: 'Erro ao testar relações: ' + error.message },
      { status: 500 }
    );
  }
}
