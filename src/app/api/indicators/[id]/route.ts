import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const prisma = new PrismaClient()

// Schema para validação dos dados
const indicatorSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  subtitle: z.string().optional(),
  value: z.string().min(1, 'Valor é obrigatório'),
  icon: z.string().optional(),
  iconColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  order: z.number().int().positive('Ordem deve ser um número positivo'),
  active: z.boolean().default(true)
})

// GET /api/indicators/[id] - Buscar um indicador específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const indicator = await prisma.indicator.findUnique({
      where: { id: params.id }
    })
    
    if (!indicator) {
      return NextResponse.json(
        { message: 'Indicador não encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(indicator)
  } catch (error) {
    console.error('Erro ao buscar indicador:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar indicador' },
      { status: 500 }
    )
  }
}

// PUT /api/indicators/[id] - Atualizar um indicador
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Verifica autenticação
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    // Verifica se o indicador existe
    const existingIndicator = await prisma.indicator.findUnique({
      where: { id: params.id }
    })
    
    if (!existingIndicator) {
      return NextResponse.json(
        { message: 'Indicador não encontrado' },
        { status: 404 }
      )
    }
    
    const data = await request.json()
    
    // Valida dados
    const validationResult = indicatorSchema.safeParse(data)
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Dados inválidos', errors: validationResult.error.format() },
        { status: 400 }
      )
    }
    
    // Atualiza indicador
    const updatedIndicator = await prisma.indicator.update({
      where: { id: params.id },
      data: {
        title: data.title,
        subtitle: data.subtitle,
        value: data.value,
        icon: data.icon,
        iconColor: data.iconColor,
        backgroundColor: data.backgroundColor,
        textColor: data.textColor,
        order: data.order,
        active: data.active,
        updatedAt: new Date(),
        updatedBy: session.user.id
      }
    })
    
    return NextResponse.json(updatedIndicator)
  } catch (error) {
    console.error('Erro ao atualizar indicador:', error)
    return NextResponse.json(
      { message: 'Erro ao atualizar indicador' },
      { status: 500 }
    )
  }
}

// DELETE /api/indicators/[id] - Excluir um indicador
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Verifica autenticação
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    // Verifica se o indicador existe
    const existingIndicator = await prisma.indicator.findUnique({
      where: { id: params.id }
    })
    
    if (!existingIndicator) {
      return NextResponse.json(
        { message: 'Indicador não encontrado' },
        { status: 404 }
      )
    }
    
    // Exclui indicador
    await prisma.indicator.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json(
      { message: 'Indicador excluído com sucesso' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao excluir indicador:', error)
    return NextResponse.json(
      { message: 'Erro ao excluir indicador' },
      { status: 500 }
    )
  }
}
