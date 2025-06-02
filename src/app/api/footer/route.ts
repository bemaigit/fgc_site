import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FooterConfig, FooterMenu } from '@prisma/client'

interface FooterConfigWithMenus extends FooterConfig {
  menus: FooterMenu[]
}

export async function GET() {
  try {
    // Primeiro, verifica se existe uma configuração
    const config = await prisma.footerConfig.findFirst()

    // Se não existir, cria uma configuração padrão
    if (!config) {
      const defaultConfig = await prisma.footerConfig.create({
        data: {
          id: 'default-footer',
          logo: '/images/logo-fgc.png',
          background: '#08285d',
          hoverColor: '#177cc3',
          textColor: '#ffffff',
          isActive: true,
          cnpj: 'XX.XXX.XXX/0001-XX',
          endereco: 'Rua XX, no XXX',
          cidade: 'Goiânia',
          estado: 'GO',
          telefone: '(62) 3000-0000',
          email: 'contato@fgc.org.br',
          whatsapp: '(62) 90000-0000'
        }
      })

      const response: FooterConfigWithMenus = {
        ...defaultConfig,
        menus: []
      }

      return NextResponse.json({ config: response })
    }

    // Buscar a configuração
    const fullConfig = await prisma.footerConfig.findUnique({
      where: { id: config.id }
    })

    if (!fullConfig) {
      throw new Error('Configuração não encontrada')
    }

    // Buscar os menus ativos
    const menus = await prisma.footerMenu.findMany({
      where: { 
        footerId: config.id,
        isActive: true 
      },
      orderBy: { order: 'asc' }
    })

    const response: FooterConfigWithMenus = {
      ...fullConfig,
      menus
    }

    return NextResponse.json({ config: response })
  } catch (error) {
    console.error('Erro ao buscar configuração do footer:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar configuração do footer' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    const data = await request.json()

    // Atualizar configuração
    const updatedConfig = await prisma.footerConfig.upsert({
      where: {
        id: 'default-footer'
      },
      update: {
        logo: data.logo,
        background: data.background,
        hoverColor: data.hoverColor,
        textColor: data.textColor,
        isActive: true,
        cnpj: data.cnpj,
        endereco: data.endereco,
        cidade: data.cidade,
        estado: data.estado,
        telefone: data.telefone,
        email: data.email,
        whatsapp: data.whatsapp,
        updatedAt: new Date()
      },
      create: {
        id: 'default-footer',
        logo: data.logo,
        background: data.background || '#08285d',
        hoverColor: data.hoverColor || '#177cc3',
        textColor: data.textColor || '#ffffff',
        isActive: true,
        cnpj: data.cnpj || '',
        endereco: data.endereco || '',
        cidade: data.cidade || '',
        estado: data.estado || '',
        telefone: data.telefone || '',
        email: data.email || '',
        whatsapp: data.whatsapp || '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      message: 'Configuração atualizada com sucesso',
      config: updatedConfig
    })

  } catch (error) {
    console.error('Erro ao atualizar configurações do footer:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações' },
      { status: 500 }
    )
  }
}
