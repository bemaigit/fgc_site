import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { createSlug } from '@/lib/utils/slug'
import { authOptions } from '../auth/[...nextauth]/route'
import crypto from 'crypto'

const createGallerySchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  modality: z.string().min(1),
  category: z.string().min(1),
  date: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createGallerySchema.parse(body)

    // Criar slug a partir do título
    const slug = createSlug(validatedData.title)

    // Verificar se já existe uma galeria com este slug
    const existingGallery = await prisma.galleryEvent.findUnique({
      where: { slug }
    })

    if (existingGallery) {
      return NextResponse.json(
        { error: 'Já existe uma galeria com este título' },
        { status: 400 }
      )
    }

    // Gerar ID único para a galeria
    const id = crypto.randomUUID()

    // Criar a galeria
    const gallery = await prisma.galleryEvent.create({
      data: {
        id,
        title: validatedData.title,
        description: validatedData.description,
        modality: validatedData.modality,
        category: validatedData.category,
        date: new Date(validatedData.date),
        slug,
        updatedAt: new Date(),
      }
    })

    return NextResponse.json(gallery)
  } catch (error) {
    console.error('Erro ao criar galeria:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const modality = searchParams.get('modality')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    
    const filters = {
      where: {
        ...(modality ? { modality } : {}),
        ...(category ? { category } : {})
      }
    }

    const [total, galleries] = await Promise.all([
      prisma.galleryEvent.count(filters),
      prisma.galleryEvent.findMany({
        ...filters,
        skip,
        take: limit,
        orderBy: {
          date: 'desc'
        },
        include: {
          GalleryImage: {
            take: 1,
            orderBy: {
              createdAt: 'asc'
            }
          },
          _count: {
            select: {
              GalleryImage: true
            }
          }
        }
      })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: galleries,
      pagination: {
        total,
        page,
        totalPages,
        limit
      }
    })
  } catch (error) {
    console.error('Erro ao buscar galerias:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
