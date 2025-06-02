import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema para validar os parâmetros da requisição
const querySchema = z.object({
  modalityId: z.string().optional(),
  genderId: z.string().optional(),
  active: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
  categoryIds: z.string().optional(),
})

/**
 * GET /api/events/categories-by-modality-gender
 * 
 * Retorna categorias filtradas por modalidade e gênero
 * Parâmetros opcionais:
 * - modalityId: ID da modalidade para filtrar
 * - genderId: ID do gênero para filtrar
 * - active: true para retornar apenas relações ativas
 * - categoryIds: IDs das categorias específicas para buscar
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Extrair e validar parâmetros da URL
    const { searchParams } = new URL(request.url)
    const params = {
      modalityId: searchParams.get('modalityId') || undefined,
      genderId: searchParams.get('genderId') || undefined,
      active: searchParams.get('active') || undefined,
      categoryIds: searchParams.get('categoryIds') || undefined,
    }

    const result = querySchema.safeParse(params)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: result.error.format() },
        { status: 400 }
      )
    }

    const { modalityId, genderId, active, categoryIds } = result.data

    console.log('API categorias-by-modality-gender - Parâmetros recebidos:', {
      modalityId,
      genderId,
      active,
      categoryIds
    })
    
    // Verificar se recebemos múltiplos genderIds
    let genderIds: string[] = []
    if (genderId) {
      // Verificar se genderId contém múltiplos IDs separados por vírgula
      if (genderId.includes(',')) {
        genderIds = genderId.split(',')
        console.log('API categorias-by-modality-gender - Múltiplos gêneros detectados:', genderIds)
      } else {
        genderIds = [genderId]
      }
    }

    // Verificar se recebemos uma lista de categoryIds na query
    let categoryIdsArray: string[] = []
    if (categoryIds) {
      categoryIdsArray = categoryIds.split(',')
      console.log('API categorias-by-modality-gender - Categorias específicas solicitadas:', categoryIdsArray)
    }
    
    // Se temos categoryIds específicos, buscar diretamente essas categorias
    if (categoryIdsArray.length > 0) {
      console.log('API categorias-by-modality-gender - Buscando categorias específicas')
      
      const specificCategories = await prisma.eventCategory.findMany({
        where: {
          id: {
            in: categoryIdsArray
          },
          active: active !== undefined ? active : true
        }
      })
      
      console.log(`API categorias-by-modality-gender - Categorias específicas encontradas: ${specificCategories.length}`)
      
      if (specificCategories.length > 0) {
        const formattedCategories = specificCategories.map(cat => ({
          id: cat.id,
          name: cat.name,
          description: cat.description || '',
          active: cat.active,
          modalityIds: modalityId ? [modalityId] : []
        }))
        
        return NextResponse.json({
          success: true,
          data: formattedCategories
        })
      }
    }

    // Construir a query para o Prisma
    const where: any = {}
    
    // Adicionar filtros conforme os parâmetros
    if (modalityId) {
      where.modalityId = modalityId
    }
    
    if (genderIds.length > 0) {
      where.genderId = {
        in: genderIds
      }
    } else if (genderId) {
      where.genderId = genderId
    }
    
    if (active !== undefined) {
      where.active = active
    }
    
    console.log('API categorias-by-modality-gender - Condições de busca:', JSON.stringify(where))
    
    // Buscar as relações no banco de dados
    const relations = await (prisma as any).ModalityCategoryGender.findMany({
      where,
      include: {
        EventCategory: true,
        EventModality: true,
        Gender: true
      }
    })
    
    console.log(`API categorias-by-modality-gender - Relações encontradas: ${relations.length}`)
    
    // Se não encontrou relações, tentar buscar categorias diretamente pela modalidade
    if (relations.length === 0 && modalityId) {
      console.log('API categorias-by-modality-gender - Buscando categorias diretamente pela modalidade')
      
      const categoriesByModality = await (prisma as any).EventModalityToCategory.findMany({
        where: {
          modalityId
        },
        include: {
          EventCategory: true
        }
      })
      
      console.log(`API categorias-by-modality-gender - Categorias encontradas pela modalidade: ${categoriesByModality.length}`)
      
      if (categoriesByModality.length > 0) {
        const categoriesFromModality = categoriesByModality.map((rel: any) => ({
          id: rel.EventCategory.id,
          name: rel.EventCategory.name,
          description: rel.EventCategory.description,
          active: rel.EventCategory.active,
          modalityIds: [modalityId]
        }))
        
        return NextResponse.json({
          success: true,
          data: categoriesFromModality
        })
      }
    }
    
    // Extrair as categorias únicas das relações
    const uniqueCategories = Array.from(
      new Map(
        relations.map((rel: any) => [
          rel.EventCategory.id,
          {
            id: rel.EventCategory.id,
            name: rel.EventCategory.name,
            description: rel.EventCategory.description,
            active: rel.EventCategory.active,
            modalityIds: [rel.modalityId]  // Iniciar com o modalityId da relação atual
          }
        ])
      ).values()
    )
    
    // Para cada categoria, buscar todas as suas modalidades relacionadas
    if (uniqueCategories.length > 0) {
      const categoryIds = uniqueCategories.map((cat: any) => cat.id)
      
      // Buscar todas as relações entre categorias e modalidades para estas categorias
      const modalityRelations = await (prisma as any).EventModalityToCategory.findMany({
        where: {
          categoryId: {
            in: categoryIds
          }
        }
      })
      
      // Agrupar as modalidades por categoria
      const modalitiesByCategory: Record<string, string[]> = {}
      modalityRelations.forEach((relation: any) => {
        if (!modalitiesByCategory[relation.categoryId]) {
          modalitiesByCategory[relation.categoryId] = []
        }
        modalitiesByCategory[relation.categoryId].push(relation.modalityId)
      })
      
      // Atualizar as categorias com todas as suas modalidades
      uniqueCategories.forEach((category: any) => {
        category.modalityIds = modalitiesByCategory[category.id] || []
      })
    }
    
    return NextResponse.json({
      success: true,
      data: uniqueCategories
    })
  } catch (error) {
    console.error('Erro ao buscar categorias por modalidade e gênero:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
