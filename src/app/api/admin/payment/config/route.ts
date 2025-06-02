"use server"

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const CONFIG_ID = 'payment-config'

// Handler GET para retornar as configurações de pagamento
export async function GET() {
  try {
    const config = await prisma.payment_system_config.findUnique({
      where: { id: CONFIG_ID }
    })

    if (!config) {
      // Se não existir, cria com valores padrão
      const defaultConfig = await prisma.payment_system_config.create({
        data: {
          id: CONFIG_ID,
          notificationEmails: [],
          successUrl: '/pagamento/sucesso',
          failureUrl: '/pagamento/erro',
          maxInstallments: 12,
          updatedAt: new Date()
        }
      })
      return NextResponse.json(defaultConfig, { status: 200 })
    }

    return NextResponse.json(config, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Handler PUT para atualizar as configurações de pagamento
export async function PUT(request: Request) {
  try {
    const data = await request.json()

    // Validação básica dos dados
    if (
      !data ||
      typeof data.successUrl !== 'string' ||
      typeof data.failureUrl !== 'string' ||
      !Array.isArray(data.notificationEmails) ||
      typeof data.maxInstallments !== 'number'
    ) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Atualiza a configuração
    const updatedConfig = await prisma.payment_system_config.upsert({
      where: { id: CONFIG_ID },
      create: {
        id: CONFIG_ID,
        notificationEmails: data.notificationEmails,
        successUrl: data.successUrl,
        failureUrl: data.failureUrl,
        maxInstallments: data.maxInstallments,
        updatedAt: new Date()
      },
      update: {
        notificationEmails: data.notificationEmails,
        successUrl: data.successUrl,
        failureUrl: data.failureUrl,
        maxInstallments: data.maxInstallments,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedConfig, { status: 200 })
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
