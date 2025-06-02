import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
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

// GET /api/indicators - Listar todos os indicadores
export async function GET() {
  try {
    const indicators = await prisma.indicator.findMany({
      orderBy: { order: 'asc' }
    })
    
    return NextResponse.json(indicators)
  } catch (error) {
    console.error('Erro ao buscar indicadores:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar indicadores' },
      { status: 500 }
    )
  }
}

// POST /api/indicators - Criar um novo indicador
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Verifica autenticação
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
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
    
    // Cria indicador
    const indicator = await prisma.indicator.create({
      data: {
        id: uuidv4(),
        title: data.title,
        subtitle: data.subtitle,
        value: data.value,
        icon: data.icon,
        iconColor: data.iconColor,
        backgroundColor: data.backgroundColor,
        textColor: data.textColor,
        order: data.order,
        active: data.active,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: session.user.id,
        updatedBy: session.user.id
      }
    })
    
    return NextResponse.json(indicator, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar indicador:', error)
    return NextResponse.json(
      { message: 'Erro ao criar indicador' },
      { status: 500 }
    )
  }
}
