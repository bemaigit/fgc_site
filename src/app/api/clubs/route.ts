import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const clubs = await prisma.club.findMany({
      where: { active: true },
      orderBy: { clubName: 'asc' },
      select: {
        id: true,
        clubName: true,
        responsibleName: true
      }
    })
    
    return NextResponse.json(clubs)
  } catch (error) {
    console.error('Erro ao buscar clubes:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar clubes' },
      { status: 500 }
    )
  }
}
