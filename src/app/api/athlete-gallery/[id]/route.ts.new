import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/athlete-gallery/[id] - Obtém uma imagem específica da galeria
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    
    if (!id) {
      return NextResponse.json({ error: 'ID da imagem não fornecido' }, { status: 400 })
    }
    
    const image = await prisma.athleteGallery.findUnique({
      where: { id }
    })
    
    if (!image) {
      return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 })
    }
    
    return NextResponse.json(image)
  } catch (error) {
    console.error('Erro ao buscar imagem da galeria:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar imagem da galeria' },
      { status: 500 }
    )
  }
}

// PATCH /api/athlete-gallery/[id] - Atualiza uma imagem da galeria
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const session = await getServerSession(authOptions)
    
    // Verifica autenticação
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    // Obtém a imagem atual
    const currentImage = await prisma.athleteGallery.findUnique({
      where: { id },
      include: {
        Athlete: {
          select: {
            id: true,
            userId: true
          }
        }
      }
    })
    
    if (!currentImage) {
      return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 })
    }
    
    // Verifica permissões: ou é o próprio atleta ou é um admin
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
    const isOwner = session.user.id === currentImage.Athlete.userId
    
    console.log('Verificação de permissões PATCH:', {
      sessionUserId: session.user.id,
      athleteUserId: currentImage.Athlete.userId,
      isAdmin,
      isOwner
    })
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Sem permissão para esta operação' }, { status: 403 })
    }
    
    const data = await request.json()
    const { title, description, featured, order } = data
    
    // Se está definindo como featured, remove a marcação de outras imagens
    if (featured) {
      await prisma.athleteGallery.updateMany({
        where: { 
          athleteId: currentImage.athleteId,
          id: { not: id },
          featured: true
        },
        data: { 
          featured: false 
        }
      })
    }
    
    // Atualiza a imagem
    const updatedImage = await prisma.athleteGallery.update({
      where: { id },
      data: {
        title,
        description,
        featured,
        order,
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json(updatedImage)
  } catch (error) {
    console.error('Erro ao atualizar imagem da galeria:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar imagem da galeria' },
      { status: 500 }
    )
  }
}

// DELETE /api/athlete-gallery/[id] - Remove uma imagem da galeria
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const session = await getServerSession(authOptions)
    
    console.log('Tentativa de exclusão para imagem:', id)
    
    // Verifica autenticação
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    // Obtém a imagem atual
    const currentImage = await prisma.athleteGallery.findUnique({
      where: { id },
      include: {
        Athlete: {
          select: {
            id: true,
            userId: true
          }
        }
      }
    })
    
    if (!currentImage) {
      return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 })
    }
    
    // Verifica permissões: ou é o próprio atleta ou é um admin
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
    const isOwner = session.user.id === currentImage.Athlete.userId
    
    console.log('Verificação de permissões DELETE:', {
      sessionUserId: session.user.id,
      athleteId: currentImage.Athlete.id,
      athleteUserId: currentImage.Athlete.userId,
      isAdmin,
      isOwner
    })
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Sem permissão para esta operação' }, { status: 403 })
    }
    
    // Remove a imagem
    await prisma.athleteGallery.delete({
      where: { id }
    })
    
    // Atualiza a ordem das imagens restantes
    const remainingImages = await prisma.athleteGallery.findMany({
      where: { athleteId: currentImage.athleteId },
      orderBy: { order: 'asc' }
    })
    
    // Reordena as imagens
    for (let i = 0; i < remainingImages.length; i++) {
      await prisma.athleteGallery.update({
        where: { id: remainingImages[i].id },
        data: { order: i }
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao remover imagem da galeria:', error)
    return NextResponse.json(
      { error: 'Erro ao remover imagem da galeria' },
      { status: 500 }
    )
  }
}
