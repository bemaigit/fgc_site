"use server"

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from 'zod'

// Schema de validação
const updatePhoneSchema = z.object({
  phone: z.string().min(8, { message: 'Telefone inválido' }).max(20)
})

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

    console.log('Dados da sessão:', JSON.stringify(session, null, 2))
    
    // Verificar se temos o ID do usuário na sessão
    if (!session.user.id) {
      console.error('ID do usuário não encontrado na sessão:', session)
      return NextResponse.json(
        { error: "ID do usuário não encontrado" },
        { status: 500 }
      )
    }

    const userId = session.user.id
    const data = await request.json()

    // Validar dados recebidos
    const validation = updatePhoneSchema.safeParse(data)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.format() },
        { status: 400 }
      )
    }

    // Verificar se o usuário já tem um registro de atleta
    let athlete = await prisma.athlete.findUnique({
      where: { userId }
    })

    // Se não tiver, criar um registro parcial
    if (!athlete) {
      athlete = await prisma.athlete.create({
        data: {
          id: `temp_${userId}`, // ID temporário baseado no userId
          userId,
          phone: data.phone,
          // Campos obrigatórios com valores padrão para registro parcial
          fullName: '',
          cpf: `temp_${userId}`, // Valor temporário único
          birthDate: new Date(), // Data atual como padrão
          address: '',
          city: '',
          state: '',
          zipCode: '',
          modalities: [],
          category: 'PENDENTE',
          paymentStatus: 'PENDENTE',
          active: false, // Não é considerado ativo até completar a filiação
          updatedAt: new Date()
        }
      })
    } 
    // Se já tiver, apenas atualizar o telefone
    else {
      athlete = await prisma.athlete.update({
        where: { userId },
        data: {
          phone: data.phone,
          updatedAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      phone: athlete.phone
    })
  } catch (error) {
    console.error("Erro ao atualizar telefone do usuário:", error)
    
    // Fornecer detalhes do erro para facilitar o diagnóstico
    const errorMessage = error instanceof Error 
      ? `${error.message}\n${error.stack}` 
      : String(error)
    
    return NextResponse.json(
      { error: "Erro ao atualizar telefone do usuário", details: errorMessage },
      { status: 500 }
    )
  }
}
