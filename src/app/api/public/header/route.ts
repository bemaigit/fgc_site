import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { storageService } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Busca a configuração do header e os menus
    const config = await prisma.headerConfig.findUnique({
      where: { id: 'default-header' },
      include: {
        HeaderMenu: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!config) {
      return NextResponse.json(
        { error: 'Configuração não encontrada' },
        { status: 404 }
      )
    }

    let logoUrl = config.logo

    // Se o logo começa com /, mantém como está (arquivo local)
    if (config.logo.startsWith('/')) {
      logoUrl = config.logo
    } 
    // Se não começa com http nem /, tenta gerar URL do MinIO
    else if (!config.logo.startsWith('http')) {
      try {
        logoUrl = await storageService.getUrl(config.logo)
      } catch (error) {
        console.error('Erro ao gerar URL do logo:', error)
        // Em caso de erro no MinIO, tenta usar caminho local
        logoUrl = `/images/${config.logo}`
      }
    }

    return NextResponse.json({
      config: {
        ...config,
        logo: logoUrl
      },
      menus: config.HeaderMenu
    })
  } catch (error) {
    console.error('Erro ao buscar configurações do header:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    )
  }
}
