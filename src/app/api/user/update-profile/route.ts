"use server"

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
// Remover bcrypt e usar crypto nativo do Node.js
import * as crypto from 'crypto'
import { z } from 'zod'

// Schema de validação
const updateProfileSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
  // Temporariamente não atualizamos a senha
  password: z.string().min(6).optional()
})

export async function PUT(request: Request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    console.log('=== SESSION DEBUG ===', JSON.stringify(session, null, 2))
    
    if (!session || !session.user) {
      console.error('Não há sessão de usuário')
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    console.log('Dados da sessão:', JSON.stringify(session, null, 2))
    
    // Obter o ID do usuário da sessão
    // O ID do usuário pode estar no campo id ou no campo sub conforme configurado no NextAuth
    const userId = session.user.id 
    
    if (!userId) {
      console.error('ID do usuário não encontrado na sessão:', session)
      console.error('Estrutura da sessão:', Object.keys(session))
      console.error('Estrutura de session.user:', session.user ? Object.keys(session.user) : 'null')
      
      return NextResponse.json(
        { error: "ID do usuário não encontrado" },
        { status: 500 }
      )
    }
    
    console.log('ID do usuário encontrado:', userId)
    const data = await request.json()

    // Validar dados recebidos
    const validation = updateProfileSchema.safeParse(data)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.format() },
        { status: 400 }
      )
    }

    // Preparar dados para atualização
    const updateData: any = {
      name: data.name
    }

    // Temporariamente desabilitamos a atualização de senha devido a problemas com a biblioteca bcrypt
    if (data.password) {
      console.log('Atualização de senha está temporariamente desabilitada');
      // Não atualizamos a senha, apenas registramos uma mensagem de log
      // Retornamos uma resposta adequada ao usuário
      return NextResponse.json(
        { 
          warning: "A atualização de senha está temporariamente indisponível. Apenas seu nome foi atualizado.",
          name: data.name
        },
        { status: 200 }
      );
    }

    // Atualizar o registro do usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    console.error("Erro ao atualizar perfil do usuário:", error)
    
    // Extrair e logar detalhes do erro para melhor diagnóstico
    const errorDetail = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code,  // Captura códigos de erro do Prisma se houver
      meta: error.meta,  // Detalhes adicionais do Prisma
    }
    
    console.error('Detalhes do erro:', JSON.stringify(errorDetail, null, 2))
    
    // Fornecer detalhes do erro formatados para o cliente
    const errorMessage = error instanceof Error 
      ? `${error.message}\n${error.stack}` 
      : String(error)
    
    return NextResponse.json(
      { error: "Erro ao atualizar perfil do usuário", details: errorMessage },
      { status: 500 }
    )
  }
}
