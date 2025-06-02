import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Buscar modalidades diretamente da tabela EventModality
    const modalities = await prisma.eventModality.findMany({
      where: {
        active: true
      },
      select: {
        id: true,
        name: true
      }
    })
    
    // Buscar categorias diretamente da tabela EventCategory
    const categories = await prisma.eventCategory.findMany({
      select: {
        id: true,
        name: true,
        ModalityCategoryGender: {
          select: {
            modalityId: true,
            EventModality: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc' // Ordenar por nome para facilitar a exibição
      },
      distinct: ['name'] // Garantir que não haverá nomes duplicados
    })
    
    // Buscar gêneros para referência
    const genders = await prisma.gender.findMany({
      select: {
        id: true,
        name: true
      }
    })

    // Formatar as modalidades para a resposta no formato esperado pelo front-end
    const formattedModalities = modalities.map(modality => ({
      id: modality.id,
      name: modality.name
    }))
    
    // Processar as categorias e associar com suas modalidades
    // Usar um Set para rastrear os IDs já usados e evitar duplicações
    const usedIds = new Set<string>()
    const formattedCategories = categories.flatMap(category => {
      // Verificar se a categoria tem associações com modalidades
      if (category.ModalityCategoryGender && category.ModalityCategoryGender.length > 0) {
        // Para cada associação da categoria com modalidade, criar um ID combinado para evitar chaves duplicadas
        return category.ModalityCategoryGender.map(mcg => {
          // Gerar ID único que não depende apenas da combinação de IDs existentes
          const baseId = `${category.id}-${mcg.modalityId}`
          let uniqueId = baseId
          
          // Se o ID já existe, adicionar um sufixo numérico
          let counter = 1
          while (usedIds.has(uniqueId)) {
            uniqueId = `${baseId}-${counter++}`
          }
          
          // Registrar o ID como usado
          usedIds.add(uniqueId)
          
          return {
            id: uniqueId,
            originalId: category.id, // Manter o ID original para uso nas queries
            name: category.name,
            modality: mcg.modalityId,
            modalityName: mcg.EventModality?.name || 'Desconhecida'
          }
        })
      } else {
        // Categorias sem associação específica
        const baseId = `${category.id}-all`
        let uniqueId = baseId
        
        // Se o ID já existe, adicionar um sufixo numérico
        let counter = 1
        while (usedIds.has(uniqueId)) {
          uniqueId = `${baseId}-${counter++}`
        }
        
        // Registrar o ID como usado
        usedIds.add(uniqueId)
        
        return [{
          id: uniqueId,
          originalId: category.id, // Manter o ID original para uso nas queries
          name: category.name,
          modality: '', // Sem modalidade específica
          modalityName: 'Todas'
        }]
      }
    })

    // Formatando gêneros para uso no front-end
    const formattedGenders = genders.map(gender => ({
      id: gender.id,
      name: gender.name
    }))

    // Retornar os dados estruturados
    return NextResponse.json({
      modalities: formattedModalities,
      categories: formattedCategories,
      genders: formattedGenders,
      // Incluir mapeamentos para referência (isto ajudará o frontend)
      mappings: {
        modalities: {
          'MTB': 'cm7roc93s0002kja8p293o507',
          'ROAD': 'cm7ro2ao80001kja8o4jdj323',
          'BMX': 'cm7rod87g0003kja83a2xjgwv'
        },
        genders: {
          'MALE': 'b4f82f14-79d6-4123-a29b-4d45ff890a52',
          'FEMALE': '7718a8b0-03f1-42af-a484-6176f8bf055e'
        },
        categories: {
          'ELITE': 'cm7roxtzq0011kja8s7xxmq2n',
          'JUNIOR': '3524e809-1524-4219-81dd-5a6459aa1894',
          'SUB-23': '4e681273-544f-46ef-8105-9c33c3fac95e',
          'Master A': 'e9fb334c-f044-4cd0-818f-0a82f698c0ad'
        }
      }
    })
  } catch (error) {
    console.error('Erro ao buscar modalidades e categorias:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar modalidades e categorias' },
      { status: 500 }
    )
  }
}
