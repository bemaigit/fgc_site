"use server"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { email, clubId } = data
    
    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      )
    }
    
    // Verificar se o clube existe
    if (clubId) {
      const clubExists = await prisma.club.findUnique({
        where: { id: clubId }
      })
      
      if (!clubExists) {
        return NextResponse.json(
          { error: "Clube não encontrado" },
          { status: 404 }
        )
      }
    }
    
    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        isManager: true,
        managedClubId: clubId || null,
      }
    })
    
    return NextResponse.json({
      success: true,
      message: "Usuário configurado como dirigente com sucesso",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        isManager: updatedUser.isManager,
        managedClubId: updatedUser.managedClubId
      }
    })
    
  } catch (error: any) {
    console.error("Erro ao configurar dirigente:", error)
    return NextResponse.json(
      { error: "Erro ao configurar dirigente", message: error.message },
      { status: 500 }
    )
  }
}
