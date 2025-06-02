import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    // Dados fixos para atualização - não precisamos de input do usuário
    const email = "w.betofoto@hotmail.com";
    const clubId = "4c832113-1796-418a-b402-723bf88d6b62"; // ID correto do clube
    
    // Verificar se o usuário existe
    const userExists = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true }
    })
    
    if (!userExists) {
      return NextResponse.json(
        { error: "Usuário não encontrado com este email" },
        { status: 404 }
      )
    }
    
    // Verificar se o clube existe
    const clubExists = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, clubName: true }
    })
    
    if (!clubExists) {
      return NextResponse.json(
        { error: "Clube não encontrado com este ID" },
        { status: 404 }
      )
    }
    
    // Atualizar usuário como dirigente
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        isManager: true,
        managedClubId: clubId,
      }
    })
    
    return NextResponse.json({
      success: true,
      message: `Usuário ${updatedUser.name} atualizado com sucesso como dirigente do clube ${clubExists.clubName}`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        isManager: updatedUser.isManager,
        managedClubId: updatedUser.managedClubId
      },
      clube: {
        id: clubExists.id,
        nome: clubExists.clubName
      }
    })
    
  } catch (error: any) {
    console.error("Erro ao atualizar usuário como dirigente:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar usuário", message: error.message },
      { status: 500 }
    )
  }
}
