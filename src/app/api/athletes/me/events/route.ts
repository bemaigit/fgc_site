"use server"

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    // Obter a sessão do usuário
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Obter parâmetros de paginação da URL
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    
    // Verificar se o usuário tem perfil de atleta (apenas para log, não bloqueia)
    const athlete = await prisma.athlete.findUnique({
      where: { userId }
    })
    
    console.log(`Usuário ${userId} ${athlete ? 'tem' : 'não tem'} perfil de atleta associado`)

    // Buscar as inscrições do usuário
    const registrationsCount = await prisma.registration.count({
      where: { userId: userId }
    })

    const registrations = await prisma.registration.findMany({
      where: { userId: userId },
      include: {
        Event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            location: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    // Formatar os dados para a resposta
    const events = registrations.map(reg => ({
      id: reg.Event.id,
      name: reg.Event.title,
      date: reg.Event.startDate,
      location: reg.Event.location,
      status: reg.Event.status,
      registrationStatus: reg.status,
      registrationId: reg.id,
      categoryId: reg.categoryid,
      modalityId: reg.modalityid,
      genderId: reg.genderid
    }))

    return NextResponse.json({
      events,
      total: registrationsCount,
      page,
      limit,
      totalPages: Math.ceil(registrationsCount / limit)
    })
  } catch (error) {
    console.error("Erro ao buscar eventos do atleta:", error)
    return NextResponse.json(
      { error: "Erro ao buscar eventos do atleta" },
      { status: 500 }
    )
  }
}
