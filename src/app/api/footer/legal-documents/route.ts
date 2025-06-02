import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema de validação
const updateDocumentSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  isActive: z.boolean()
})

// GET - Buscar todos os documentos
export async function GET() {
  try {
    const documents = await prisma.legalDocuments.findMany({
      orderBy: { type: 'asc' }
    })
    return NextResponse.json(documents)
  } catch (error) {
    console.error('Erro ao buscar documentos legais:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar documentos legais' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar um documento
export async function PATCH(req: Request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Validar dados
    const body = await req.json()
    const { id, ...data } = body

    const validatedData = updateDocumentSchema.parse(data)

    // Atualizar documento
    const document = await prisma.legalDocuments.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
        updatedBy: session.user.id
      }
    })

    return NextResponse.json(document)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao atualizar documento legal:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar documento legal' },
      { status: 500 }
    )
  }
}
