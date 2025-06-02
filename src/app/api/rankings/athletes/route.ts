import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import crypto from 'crypto'

// GET /api/rankings/athletes
export async function GET(request: Request) {
  try {
    console.log('Iniciando busca de atletas no ranking')
    
    // Nota: Esta rota é pública e não requer autenticação, pois os dados de atletas são informações públicas
    // que podem ser exibidas para qualquer visitante do site.

    // Pega os parâmetros da URL
    const { searchParams } = new URL(request.url)
    const modality = searchParams.get('modality')
    const category = searchParams.get('category')
    const gender = searchParams.get('gender')

    console.log('Filtros recebidos:', { modality, category, gender })

    // Primeiro, buscamos as configurações de ranking que correspondem aos filtros
    interface RankingConfig {
      id: string
      gender: string
      modality_name: string
      category_name: string
    }

    const rankingConfigs = await prisma.$queryRaw<RankingConfig[]>`
      SELECT 
        rc.id, 
        rc.gender,
        rm.name as "modality_name",
        rc2.name as "category_name"
      FROM "RankingConfiguration" rc
      JOIN "RankingModality" rm ON rc."modalityId" = rm.id
      JOIN "RankingCategory" rc2 ON rc."categoryId" = rc2.id
      WHERE 
        (${modality}::text IS NULL OR rm.name = ${modality})
        AND (${category}::text IS NULL OR rc2.name = ${category})
        AND (${gender}::text IS NULL OR rc.gender = ${gender})
    `

    if (!rankingConfigs || rankingConfigs.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Buscamos as entradas de ranking para as configurações encontradas
    const rankingEntries = await prisma.rankingEntry.findMany({
      where: {
        configurationId: {
          in: rankingConfigs.map((c: any) => c.id)
        }
      },
      include: {
        Athlete: {
          include: {
            AthleteGallery: {
              where: {
                OR: [
                  { featured: true },
                  { order: { not: undefined } }
                ]
              },
              orderBy: [
                { featured: 'desc' },
                { order: 'asc' }
              ],
              take: 1
            },
            User_Athlete_userIdToUser: {
              select: {
                image: true
              }
            },
            Club: {
              select: {
                clubName: true
              }
            }
          }
        }
      },
      orderBy: [
        { points: 'desc' },
        { position: 'asc' }
      ]
    })

    // Mapeia os resultados para o formato esperado pelo frontend
    const mappedRanking = rankingEntries.map((entry) => {
      const athlete = (entry as any).Athlete
      const config = rankingConfigs.find((c: any) => c.id === entry.configurationId)
      const profileImage = 
        (athlete.AthleteGallery && athlete.AthleteGallery[0]?.imageUrl) || 
        athlete.User_Athlete_userIdToUser?.image || 
        null

      return {
        id: athlete.id,
        name: athlete.fullName,
        modality: config?.modality_name || '',
        category: config?.category_name || '',
        gender: config?.gender || '',
        points: entry.points || 0,
        position: entry.position || 0,
        city: athlete.city || '',
        team: athlete.Club?.clubName || null,
        profileImage
      }
    })

    console.log(`Atletas encontrados no ranking: ${mappedRanking.length}`)

    // Ordena por pontos e posição
    const sortedRanking = [...mappedRanking].sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points
      }
      return a.position - b.position
    })

    return NextResponse.json({ data: sortedRanking })
  } catch (error) {
    console.error('Erro ao buscar atletas:', error)
    return NextResponse.json({ error: 'Erro ao buscar atletas do ranking' }, { status: 500 })
  }
}

// POST /api/rankings/athletes - Adicionar novo atleta
export async function POST(request: Request) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Obtém os dados do corpo da requisição
    const data = await request.json()
    const { 
      name, 
      modalityId, 
      categoryId, 
      gender, 
      city, 
      team, 
      cpf, 
      birthDate, 
      address, 
      state, 
      zipCode, 
      phone 
    } = data

    // Validação básica
    if (!name || !modalityId || !categoryId || !gender || !city || !cpf || !address || !state || !zipCode || !phone) {
      return NextResponse.json(
        { error: 'Dados incompletos. Todos os campos são obrigatórios exceto equipe.' },
        { status: 400 }
      )
    }

    // Gera um ID único para o usuário (temporário)
    const tempUserId = crypto.randomUUID()
    
    // Cria um usuário temporário para associar ao atleta
    const user = await prisma.user.create({
      data: {
        id: tempUserId,
        email: `temp_${tempUserId}@example.com`,
        name: name,
        role: 'USER',
        password: crypto.createHash('sha256').update(`temp_${Date.now()}`).digest('hex')
      }
    })

    // Cria o atleta com todos os campos obrigatórios
    const athlete = await prisma.athlete.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        fullName: name,
        cpf: cpf,
        birthDate: new Date(birthDate),
        address: address,
        city: city,
        state: state,
        zipCode: zipCode,
        phone: phone,
        modalities: [],
        category: "Não informada",
        paymentStatus: "PAID",
        active: true,
        updatedAt: new Date()
      }
    })

    // Busca a configuração de ranking correspondente
    const rankingConfig = await prisma.rankingConfiguration.findFirst({
      where: {
        modalityId,
        categoryId,
        gender
      }
    })

    // Se não existir configuração, cria uma nova
    let configId = rankingConfig?.id
    if (!configId) {
      const newConfig = await prisma.rankingConfiguration.create({
        data: {
          id: crypto.randomUUID(),
          name: `Ranking ${gender}`,
          modalityId,
          categoryId,
          gender,
          season: new Date().getFullYear(),
          active: true,
          updatedAt: new Date()
        }
      })
      configId = newConfig.id
    }

    // Cria a entrada no ranking com pontuação inicial 0
    await prisma.rankingEntry.create({
      data: {
        id: crypto.randomUUID(),
        athleteId: athlete.id,
        configurationId: configId,
        points: 0,
        position: 0, // Será calculado posteriormente
        city: city,
        team: team || null,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      athlete
    })
  } catch (error) {
    console.error('Erro ao criar atleta:', error)
    return NextResponse.json(
      { error: 'Erro ao criar atleta' },
      { status: 500 }
    )
  }
}
