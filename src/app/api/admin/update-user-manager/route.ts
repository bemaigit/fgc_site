import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { email, clubId, setAsManager } = data
    
    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      )
    }
    
    // Verificar se o usuário existe
    const userExists = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true }
    })
    
    if (!userExists) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }
    
    // Verificar se o clube existe (se fornecido)
    if (clubId) {
      const clubExists = await prisma.club.findUnique({
        where: { id: clubId },
        select: { id: true, clubName: true }
      })
      
      if (!clubExists) {
        return NextResponse.json(
          { error: "Clube não encontrado" },
          { status: 404 }
        )
      }
    }
    
    // Atualizar usuário como dirigente
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        isManager: setAsManager === true, // Garantir que é um booleano
        managedClubId: clubId || null, // Se não for fornecido, define como null
      }
    })
    
    return NextResponse.json({
      success: true,
      message: "Usuário atualizado com sucesso",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        isManager: updatedUser.isManager,
        managedClubId: updatedUser.managedClubId
      }
    })
    
  } catch (error: any) {
    console.error("Erro ao atualizar usuário:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar usuário", message: error.message },
      { status: 500 }
    )
  }
}
