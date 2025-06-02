import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

type ErrorWithCode = Error & { code?: string }

// Schema para validação
const modalitySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  active: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log('API: Requisição não autorizada')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Obter parâmetros da query
    const url = new URL(request.url)
    const activeOnly = url.searchParams.get('active') === 'true'
    console.log('API: Parâmetro active:', activeOnly)

    // Busca modalidades com filtro de active
    const modalities = await prisma.eventModality.findMany({
      where: activeOnly ? { active: true } : {},
      orderBy: {
        name: 'asc'
      }
    })

    console.log(`API: ${modalities.length} modalidades encontradas`)
    return NextResponse.json({
      success: true,
      data: modalities
    })
  } catch (error: unknown) {
    console.error('Erro ao buscar modalidades:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar modalidades' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verifica permissões (admin)
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Valida dados
    const data = await request.json()
    const validationResult = modalitySchema.safeParse(data)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const { name, description, active } = validationResult.data

    console.log('Criando nova modalidade:', { name, description, active })

    // Cria a modalidade no banco
    const modality = await prisma.eventModality.create({
      data: {
        id: uuidv4(),
        name,
        description,
        active: active ?? true,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        updatedAt: new Date()
      }
    })

    console.log('Modalidade criada com sucesso:', modality.id)
    return NextResponse.json(modality, { status: 201 })
  } catch (error: unknown) {
    console.error('Erro ao criar modalidade:', error)
    
    const err = error as ErrorWithCode
    if (err.code === 'P2002') {
      return NextResponse.json(
        { error: 'Já existe uma modalidade com este nome' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro ao criar modalidade' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verifica permissões (admin)
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Valida dados
    const data = await request.json()
    const validationResult = modalitySchema.safeParse(data)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const { id, name, description, active } = data

    if (!id) {
      return NextResponse.json(
        { error: 'ID da modalidade é obrigatório' },
        { status: 400 }
      )
    }

    console.log('Atualizando modalidade:', { id, name, description, active })

    // Atualiza a modalidade
    const modality = await prisma.eventModality.update({
      where: { id },
      data: {
        name,
        description,
        active: active ?? true,
        updatedBy: session.user.id,
        updatedAt: new Date()
      }
    })

    console.log('Modalidade atualizada com sucesso:', modality.id)
    return NextResponse.json(modality)
  } catch (error: unknown) {
    console.error('Erro ao atualizar modalidade:', error)
    
    const err = error as ErrorWithCode
    if (err.code === 'P2025') {
      return NextResponse.json(
        { error: 'Modalidade não encontrada' },
        { status: 404 }
      )
    } else if (err.code === 'P2002') {
      return NextResponse.json(
        { error: 'Já existe uma modalidade com este nome' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro ao atualizar modalidade' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verifica permissões (admin)
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Obtém ID da modalidade
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID da modalidade é obrigatório' },
        { status: 400 }
      )
    }

    console.log('Excluindo modalidade:', id)

    // Verifica se existem eventos usando esta modalidade
    const eventsUsingModality = await prisma.event.count({
      where: { modalityId: id }
    })

    if (eventsUsingModality > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir esta modalidade pois existem eventos vinculados a ela' },
        { status: 400 }
      )
    }

    // Exclui a modalidade
    await prisma.eventModality.delete({
      where: { id }
    })

    console.log('Modalidade excluída com sucesso')
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Erro ao excluir modalidade:', error)
    
    const err = error as ErrorWithCode
    if (err.code === 'P2025') {
      return NextResponse.json(
        { error: 'Modalidade não encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro ao excluir modalidade' },
      { status: 500 }
    )
  }
}
