import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Buscar um documento específico
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const document = await prisma.legalDocuments.findUnique({
      where: { id: params.id }
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error('Erro ao buscar documento legal:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar documento legal' },
      { status: 500 }
    )
  }
}
