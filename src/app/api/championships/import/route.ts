import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getSession } from '@/lib/session'
import { parse } from 'csv-parse/sync'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

export const config = {
  api: {
    bodyParser: false,
  },
}

// POST - Importar campeões em massa via CSV
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    
    // Verificar se o usuário está autenticado e é admin
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Parsear o corpo da requisição como FormData
    const formData = await req.formData()
    const file = formData.get('file') as File
    const eventId = formData.get('eventId') as string
    
    if (!file || !eventId) {
      return NextResponse.json(
        { error: 'Arquivo CSV e ID do evento são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o evento existe
    const existingEvent = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "ChampionshipEvent" WHERE "id" = ${eventId}
    `

    if (Number(existingEvent[0].count) === 0) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }

    // Ler e processar o arquivo CSV
    const fileBuffer = await file.arrayBuffer()
    const fileString = new TextDecoder().decode(fileBuffer)
    
    // Parsear CSV para objetos
    const records = parse(fileString, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })

    // Validar e preparar registros
    const validationErrors: string[] = []
    const validRecords: any[] = []
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      const rowNumber = i + 2 // +2 por causa do cabeçalho e índice baseado em 0
      
      // Validar campos obrigatórios
      if (!record.athleteId || !record.modalityId || !record.categoryId || 
          !record.gender || !record.position || !record.city) {
        validationErrors.push(`Linha ${rowNumber}: Campos obrigatórios ausentes`)
        continue
      }
      
      // Validar gênero
      if (record.gender !== 'MALE' && record.gender !== 'FEMALE') {
        validationErrors.push(`Linha ${rowNumber}: Gênero deve ser 'MALE' ou 'FEMALE'`)
        continue
      }
      
      // Validar posição
      const position = parseInt(record.position)
      if (isNaN(position) || position < 1) {
        validationErrors.push(`Linha ${rowNumber}: Posição deve ser um número maior que zero`)
        continue
      }
      
      // Adicionar à lista de registros válidos
      validRecords.push({
        id: uuidv4(),
        athleteId: record.athleteId,
        modalityId: record.modalityId,
        categoryId: record.categoryId,
        gender: record.gender,
        position: position,
        city: record.city,
        team: record.team || null,
        eventId: eventId,
      })
    }
    
    // Se houver erros de validação, retornar sem processar
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Erro na validação do CSV', 
          details: validationErrors.slice(0, 10), // Limitar para não sobrecarregar a resposta
          totalErrors: validationErrors.length
        },
        { status: 400 }
      )
    }
    
    // Verificar se os IDs de atletas existem
    const athleteIds = [...new Set(validRecords.map(r => r.athleteId))]
    const existingAthletes = await prisma.$queryRaw`
      SELECT id FROM "Athlete" WHERE id IN (${athleteIds.join(',')})
    `
    
    const existingAthleteIds = new Set(existingAthletes.map((a: any) => a.id))
    const invalidAthleteIds = athleteIds.filter(id => !existingAthleteIds.has(id))
    
    if (invalidAthleteIds.length > 0) {
      return NextResponse.json(
        { 
          error: 'Atletas não encontrados',
          invalidIds: invalidAthleteIds
        },
        { status: 400 }
      )
    }
    
    // Verificar se os IDs de modalidades existem
    const modalityIds = [...new Set(validRecords.map(r => r.modalityId))]
    const existingModalities = await prisma.$queryRaw`
      SELECT id FROM "ChampionModality" WHERE id IN (${modalityIds.join(',')})
    `
    
    const existingModalityIds = new Set(existingModalities.map((m: any) => m.id))
    const invalidModalityIds = modalityIds.filter(id => !existingModalityIds.has(id))
    
    if (invalidModalityIds.length > 0) {
      return NextResponse.json(
        { 
          error: 'Modalidades não encontradas',
          invalidIds: invalidModalityIds
        },
        { status: 400 }
      )
    }
    
    // Verificar se os IDs de categorias existem
    const categoryIds = [...new Set(validRecords.map(r => r.categoryId))]
    const existingCategories = await prisma.$queryRaw`
      SELECT id FROM "ChampionCategory" WHERE id IN (${categoryIds.join(',')})
    `
    
    const existingCategoryIds = new Set(existingCategories.map((c: any) => c.id))
    const invalidCategoryIds = categoryIds.filter(id => !existingCategoryIds.has(id))
    
    if (invalidCategoryIds.length > 0) {
      return NextResponse.json(
        { 
          error: 'Categorias não encontradas',
          invalidIds: invalidCategoryIds
        },
        { status: 400 }
      )
    }
    
    // Verificar duplicidades de posição dentro da mesma modalidade/categoria/gênero
    const positionMap: Record<string, number[]> = {}
    const duplicatePositions: string[] = []
    
    validRecords.forEach(record => {
      const key = `${record.modalityId}-${record.categoryId}-${record.gender}`
      if (!positionMap[key]) {
        positionMap[key] = []
      }
      
      if (positionMap[key].includes(record.position)) {
        duplicatePositions.push(
          `Posição ${record.position} duplicada para modalidade/categoria/gênero ${key}`
        )
      }
      
      positionMap[key].push(record.position)
    })
    
    if (duplicatePositions.length > 0) {
      return NextResponse.json(
        { 
          error: 'Posições duplicadas encontradas',
          details: duplicatePositions
        },
        { status: 400 }
      )
    }
    
    // Verificar conflitos com registros existentes
    for (const recordGroup of Object.entries(positionMap)) {
      const [key, positions] = recordGroup
      const [modalityId, categoryId, gender] = key.split('-')
      
      const existingPositions = await prisma.$queryRaw`
        SELECT position FROM "ChampionEntry"
        WHERE "modalityId" = ${modalityId}
        AND "categoryId" = ${categoryId}
        AND "gender" = ${gender}
        AND "eventId" = ${eventId}
        AND position IN (${positions.join(',')})
      `
      
      if (existingPositions.length > 0) {
        const conflictingPositions = existingPositions.map((p: any) => p.position)
        
        return NextResponse.json(
          { 
            error: 'Conflito de posições com campeões existentes',
            details: `Posições ${conflictingPositions.join(', ')} já existem para modalidade=${modalityId}, categoria=${categoryId}, gênero=${gender}`
          },
          { status: 400 }
        )
      }
    }
    
    // Tudo validado, inserir os registros
    const insertedCount = await insertChampions(validRecords)
    
    return NextResponse.json({
      message: 'Importação concluída com sucesso',
      imported: insertedCount
    })
  } catch (error) {
    console.error('Erro ao importar campeões:', error)
    return NextResponse.json(
      { error: 'Erro ao processar importação de campeões' },
      { status: 500 }
    )
  }
}

// Função auxiliar para inserir os registros em lotes
async function insertChampions(records: any[]) {
  let insertedCount = 0
  
  // Processamento em lotes para maior performance
  const batchSize = 100
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    
    // Construir a query de inserção em lote
    let queryValues = batch.map(record => `(
      '${record.id}', 
      '${record.athleteId}', 
      '${record.modalityId}', 
      '${record.categoryId}', 
      '${record.gender}', 
      ${record.position}, 
      '${record.city.replace(/'/g, "''")}', 
      ${record.team ? `'${record.team.replace(/'/g, "''")}'` : 'NULL'}, 
      '${record.eventId}',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )`).join(',\n')
    
    const query = `
      INSERT INTO "ChampionEntry" (
        "id", "athleteId", "modalityId", "categoryId", "gender", 
        "position", "city", "team", "eventId", "createdAt", "updatedAt"
      )
      VALUES ${queryValues}
    `
    
    await prisma.$executeRawUnsafe(query)
    insertedCount += batch.length
  }
  
  return insertedCount
}
