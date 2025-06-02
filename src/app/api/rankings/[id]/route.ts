import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const data = await request.json()

    const ranking = await prisma.ranking.update({
      where: { id: params.id },
      data: {
        athleteId: data.athleteId,
        modality: data.modality,
        category: data.category,
        gender: data.gender,
        points: data.points,
        city: data.city,
        team: data.team,
        season: data.season
      }
    })

    return NextResponse.json(ranking)
  } catch (error) {
    console.error('[RANKING_UPDATE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    await prisma.ranking.delete({
      where: { id: params.id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[RANKING_DELETE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
