"use server"

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    // Obter o ID do usuário da query string
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    // Log para debug
    console.log('🔍 API - Fetching role for userId:', userId)
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID é obrigatório" },
        { status: 400 }
      )
    }
    
    // Buscar o usuário diretamente do banco de dados
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }
    
    // Log para debug
    console.log('🔍 API - User role found:', user.role)
    
    // Retornar a role do usuário
    return NextResponse.json({ role: user.role })
  } catch (error) {
    console.error("Erro ao buscar role do usuário:", error)
    return NextResponse.json(
      { error: "Erro ao buscar role do usuário" },
      { status: 500 }
    )
  }
}
