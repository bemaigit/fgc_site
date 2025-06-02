"use server"

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const userId = session.user.id
    
    // Buscar dados do usuário diretamente
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        name: true,
        email: true, 
        role: true,
        image: true,
        isManager: true,
        managedClubId: true
      }
    })
    
    // Buscar dados do clube gerenciado (se houver)
    let managedClub = null
    if (user?.isManager && user?.managedClubId) {
      managedClub = await prisma.club.findUnique({
        where: { id: user.managedClubId },
        select: {
          id: true,
          clubName: true,
          active: true
        }
      })
    }

    // Verificar se um usuário com e-mail específico existe (o seu e-mail)
    const specificUser = await prisma.user.findUnique({
      where: { email: "w.betofoto@hotmail.com" },
      select: { 
        id: true,
        email: true, 
        isManager: true,
        managedClubId: true
      }
    })

    return NextResponse.json({
      currentSession: {
        userId: userId,
        userName: session.user.name,
        userEmail: session.user.email
      },
      userFromDatabase: user,
      managedClub,
      specificUserCheck: specificUser,
      apiEndpoint: "/api/athletes/me - dados do seu perfil"
    })
    
  } catch (error: any) {
    console.error("Erro ao buscar dados de debug:", error)
    return NextResponse.json(
      { error: "Erro ao buscar dados de debug", message: error.message },
      { status: 500 }
    )
  }
}
