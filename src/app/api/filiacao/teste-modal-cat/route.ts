import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Endpoint de teste para diagnosticar problemas com as relações entre modalidades e categorias
 */
export async function GET(request: Request) {
  try {
    // Obter todos os IDs de modalidades ativas
    const modalidades = await prisma.filiationModality.findMany({
      where: { active: true },
      select: { id: true, name: true }
    });
    
    // Para cada modalidade, busque suas categorias associadas
    const resultados = await Promise.all(
      modalidades.map(async (modalidade) => {
        // Buscar diretamente na tabela de junção
        const categoriasIds = await prisma.modalityToCategory.findMany({
          where: { 
            modalityId: modalidade.id 
          },
          select: { 
            categoryId: true 
          }
        });
        
        // Buscar detalhes completos das categorias
        const categoriasDetalhes = await prisma.filiationCategory.findMany({
          where: { 
            id: { 
              in: categoriasIds.map(c => c.categoryId) 
            },
            active: true
          },
          select: {
            id: true,
            name: true
          }
        });
        
        return {
          modalidade: modalidade.name,
          modalidadeId: modalidade.id,
          categorias: categoriasDetalhes
        };
      })
    );
    
    // Dados gerais para diagnóstico
    const totalModalidades = await prisma.filiationModality.count({ where: { active: true } });
    const totalCategorias = await prisma.filiationCategory.count({ where: { active: true } });
    const totalRelacoes = await prisma.modalityToCategory.count();
    
    return NextResponse.json({
      diagnostico: {
        totalModalidades,
        totalCategorias,
        totalRelacoes,
        tempoConsulta: new Date().toISOString()
      },
      resultados
    });
  } catch (error: any) {
    console.error('Erro no endpoint de teste:', error);
    return NextResponse.json(
      { error: 'Erro ao testar relações: ' + error.message },
      { status: 500 }
    );
  }
}
