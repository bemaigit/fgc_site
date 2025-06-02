import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const gallery = await prisma.galleryEvent.findUnique({
      where: { slug: params.slug },
      include: {
        images: true,
        _count: {
          select: { images: true }
        }
      }
    })

    if (!gallery) {
      return NextResponse.json(
        { error: 'Galeria não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(gallery)
  } catch (error) {
    console.error('Erro ao buscar galeria:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
