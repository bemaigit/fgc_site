import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('Iniciando busca de configurações do header...')

    // Buscar configuração do header
    console.log('Buscando configuração do header...')
    const config = await prisma.headerConfig.findFirst({
      where: { 
        id: 'default-header',
        isActive: true
      }
    })
    console.log('Configuração encontrada:', config)

    // Buscar todos os menus ativos
    console.log('Buscando menus ativos...')
    const menus = await prisma.headerMenu.findMany({
      where: {
        headerId: 'default-header',
        isActive: true,
        requireAuth: false // Apenas menus públicos por enquanto
      },
      orderBy: {
        order: 'asc'
      }
    })
    console.log('Menus encontrados:', menus)

    // Configuração padrão
    const defaultConfig = {
      id: 'default-header',
      logo: '/images/logo-fgc.png',
      background: '#08285d',
      hoverColor: '#177cc3',
      textColor: '#ffffff',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Preparar resposta
    const response = {
      config: config || defaultConfig,
      menus: menus || []
    }
    console.log('Resposta preparada:', response)

    return NextResponse.json(response)

  } catch (error) {
    console.error('Erro detalhado na API do header:', error)
    
    // Retornar configuração padrão em caso de erro
    return NextResponse.json({
      error: 'Erro ao buscar configurações',
      config: {
        id: 'default-header',
        logo: '/images/logo-fgc.png',
        background: '#08285d',
        hoverColor: '#177cc3',
        textColor: '#ffffff',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      menus: []
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json()

    // Validar dados
    if (!data) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      )
    }

    // Atualizar configuração
    const updatedConfig = await prisma.headerConfig.upsert({
      where: {
        id: 'default-header'
      },
      update: {
        logo: data.logo,
        background: data.background,
        hoverColor: data.hoverColor,
        textColor: data.textColor,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        id: 'default-header',
        logo: data.logo,
        background: data.background || '#08285d',
        hoverColor: data.hoverColor || '#177cc3',
        textColor: data.textColor || '#ffffff',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      message: 'Configuração atualizada com sucesso',
      config: updatedConfig
    })

  } catch (error) {
    console.error('Erro ao atualizar configurações do header:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações' },
      { status: 500 }
    )
  }
}
