import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// POST - Configurar dados iniciais de modalidades e categorias de campeões
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Verificar se o usuário está autenticado e é admin ou super_admin
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Definir modalidades iniciais
    const modalities = [
      {
        id: crypto.randomUUID(),
        name: 'Ciclismo de Estrada',
        description: 'Competições de ciclismo em estradas pavimentadas'
      },
      {
        id: crypto.randomUUID(),
        name: 'Mountain Bike',
        description: 'Competições de ciclismo off-road em terrenos naturais'
      },
      {
        id: crypto.randomUUID(),
        name: 'BMX',
        description: 'Competições de ciclismo em pistas especialmente projetadas'
      }
    ]

    // Inserir modalidades (ignorar duplicatas por nome)
    for (const modality of modalities) {
      const existing = await prisma.championModality.findFirst({
        where: { name: modality.name }
      })

      if (!existing) {
        await prisma.championModality.create({
          data: modality
        })
      }
    }

    // Buscar modalidades inseridas para usar seus IDs
    const savedModalities = await prisma.championModality.findMany()
    
    // Mapear modalidades por nome para fácil referência
    const modalityMap = savedModalities.reduce((map, mod) => {
      map[mod.name] = mod.id
      return map
    }, {} as Record<string, string>)

    // Definir categorias iniciais para cada modalidade
    const categories = [
      // Categorias para Ciclismo de Estrada
      {
        id: crypto.randomUUID(),
        name: 'Elite',
        modalityId: modalityMap['Ciclismo de Estrada'],
        description: 'Categoria principal para atletas de alto nível'
      },
      {
        id: crypto.randomUUID(),
        name: 'Sub-23',
        modalityId: modalityMap['Ciclismo de Estrada'],
        description: 'Atletas com idade até 23 anos'
      },
      {
        id: crypto.randomUUID(),
        name: 'Master A',
        modalityId: modalityMap['Ciclismo de Estrada'],
        description: 'Atletas de 30 a 39 anos'
      },
      
      // Categorias para Mountain Bike
      {
        id: crypto.randomUUID(),
        name: 'Elite',
        modalityId: modalityMap['Mountain Bike'],
        description: 'Categoria principal para atletas de alto nível'
      },
      {
        id: crypto.randomUUID(),
        name: 'Sub-23',
        modalityId: modalityMap['Mountain Bike'],
        description: 'Atletas com idade até 23 anos'
      },
      {
        id: crypto.randomUUID(),
        name: 'Master A',
        modalityId: modalityMap['Mountain Bike'],
        description: 'Atletas de 30 a 39 anos'
      },
      
      // Categorias para BMX
      {
        id: crypto.randomUUID(),
        name: 'Elite',
        modalityId: modalityMap['BMX'],
        description: 'Categoria principal para atletas de alto nível'
      },
      {
        id: crypto.randomUUID(),
        name: 'Júnior',
        modalityId: modalityMap['BMX'],
        description: 'Atletas de 17 a 18 anos'
      }
    ]

    // Inserir categorias (ignorar duplicatas por nome e modalidade)
    for (const category of categories) {
      if (!category.modalityId) continue; // Pular se a modalidade não existir
      
      const existing = await prisma.championCategory.findFirst({
        where: { 
          name: category.name,
          modalityId: category.modalityId
        }
      })

      if (!existing) {
        await prisma.championCategory.create({
          data: category
        })
      }
    }

    return NextResponse.json({
      message: 'Dados iniciais de modalidades e categorias configurados com sucesso',
      modalities: savedModalities,
      categories: await prisma.championCategory.findMany()
    })
  } catch (error) {
    console.error('Erro ao configurar dados iniciais:', error)
    return NextResponse.json(
      { error: 'Erro ao configurar dados iniciais' },
      { status: 500 }
    )
  }
}
