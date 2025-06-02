"use server"

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(request: Request) {
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
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json(
        { error: "URL da imagem não fornecida" },
        { status: 400 }
      )
    }

    // Atualizar o registro do usuário com a nova imagem
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        image: imageUrl,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Erro ao atualizar imagem do usuário:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar imagem do usuário" },
      { status: 500 }
    )
  }
}
