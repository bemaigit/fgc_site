import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema de validação para atualização de modalidade
const updateModalitySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  description: z.string().optional().nullable(),
  active: z.boolean().optional()
})

// GET /api/rankings/modalities/name/[name]
export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const decodedName = decodeURIComponent(params.name)
    console.log(`Buscando modalidade com nome: ${decodedName}`)
    
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log('Requisição não autorizada')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Tenta encontrar a modalidade pelo nome
    const modality = await prisma.rankingModality.findFirst({
      where: { name: decodedName }
    })

    if (!modality) {
      return NextResponse.json(
        { error: 'Modalidade não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(modality)
  } catch (error) {
    console.error('Erro ao buscar modalidade:', error instanceof Error ? error.message : 'Erro desconhecido')
    return NextResponse.json(
      { error: 'Erro ao buscar modalidade' },
      { status: 500 }
    )
  }
}

// PUT /api/rankings/modalities/name/[name]
export async function PUT(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const decodedName = decodeURIComponent(params.name)
    console.log(`Atualizando modalidade com nome: ${decodedName}`)
    
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log('Requisição não autorizada')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verifica se o usuário tem permissão (ADMIN ou SUPER_ADMIN)
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      console.log('Usuário sem permissão:', session.user.role)
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Tenta encontrar a modalidade pelo nome
    const existingModality = await prisma.rankingModality.findFirst({
      where: { name: decodedName }
    })

    if (!existingModality) {
      return NextResponse.json(
        { error: 'Modalidade não encontrada' },
        { status: 404 }
      )
    }

    // Pega os dados do corpo da requisição
    const data = await request.json()
    
    try {
      // Valida os dados
      const validatedData = updateModalitySchema.parse(data)
      
      // Verifica se o nome já existe (caso esteja sendo alterado)
      if (validatedData.name && validatedData.name !== existingModality.name) {
        const nameExists = await prisma.rankingModality.findFirst({
          where: { 
            name: validatedData.name,
            id: { not: existingModality.id } // Exclui a modalidade atual da verificação
          }
        })
        
        if (nameExists) {
          return NextResponse.json(
            { error: 'Já existe outra modalidade com este nome' },
            { status: 409 }
          )
        }
      }

      // Atualiza a modalidade
      const updatedModality = await prisma.rankingModality.update({
        where: { id: existingModality.id },
        data: {
          ...validatedData,
          updatedAt: new Date()
        }
      })

      console.log('Modalidade atualizada:', updatedModality.name)

      return NextResponse.json(updatedModality)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error('Erro ao atualizar modalidade:', error instanceof Error ? error.message : 'Erro desconhecido')
    return NextResponse.json(
      { error: 'Erro ao atualizar modalidade' },
      { status: 500 }
    )
  }
}

// DELETE /api/rankings/modalities/name/[name]
export async function DELETE(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const decodedName = decodeURIComponent(params.name)
    console.log(`Excluindo modalidade com nome: ${decodedName}`)
    
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log('Requisição não autorizada')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verifica se o usuário tem permissão (ADMIN ou SUPER_ADMIN)
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      console.log('Usuário sem permissão:', session.user.role)
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Tenta encontrar a modalidade pelo nome
    const existingModality = await prisma.rankingModality.findFirst({
      where: { name: decodedName }
    })

    if (!existingModality) {
      return NextResponse.json(
        { error: 'Modalidade não encontrada' },
        { status: 404 }
      )
    }

    // Verifica se existem categorias associadas a esta modalidade
    const categoriesCount = await prisma.rankingCategory.count({
      where: { modalityId: existingModality.id }
    })

    if (categoriesCount > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir. Esta modalidade possui categorias associadas.' },
        { status: 400 }
      )
    }

    // Verifica se existem configurações de ranking associadas a esta modalidade
    const configsCount = await prisma.rankingConfiguration.count({
      where: { modalityId: existingModality.id }
    })

    if (configsCount > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir. Esta modalidade está sendo usada em configurações de ranking.' },
        { status: 400 }
      )
    }

    // Exclui a modalidade
    await prisma.rankingModality.delete({
      where: { id: existingModality.id }
    })

    console.log('Modalidade excluída com sucesso:', existingModality.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir modalidade:', error instanceof Error ? error.message : 'Erro desconhecido')
    return NextResponse.json(
      { error: 'Erro ao excluir modalidade' },
      { status: 500 }
    )
  }
}
