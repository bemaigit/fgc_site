import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import { parse } from 'csv-parse/sync'

// POST /api/rankings/results/upload
export async function POST(request: Request) {
  try {
    console.log('Iniciando upload de resultados de ranking')
    
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log('Requisição não autorizada')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Pega os dados do corpo da requisição
    const formData = await request.formData()
    const file = formData.get('file') as File
    const rankingId = formData.get('rankingId') as string
    const stageName = formData.get('stageName') as string
    const date = formData.get('date') as string
    const season = parseInt(formData.get('season') as string)

    // Valida os dados
    if (!file || !rankingId || !stageName || !date || isNaN(season)) {
      return NextResponse.json(
        { error: 'Dados incompletos. Verifique se todos os campos foram preenchidos.' },
        { status: 400 }
      )
    }

    // Verifica se o ranking existe
    const ranking = await prisma.ranking.findUnique({
      where: { id: rankingId }
    })

    if (!ranking) {
      return NextResponse.json(
        { error: 'Ranking não encontrado' },
        { status: 404 }
      )
    }

    // Busca a modalidade e categoria do ranking
    const modality = await prisma.rankingModality.findUnique({
      where: { id: ranking.modality }
    })

    if (!modality) {
      return NextResponse.json(
        { error: 'Modalidade do ranking não encontrada' },
        { status: 404 }
      )
    }

    const category = await prisma.rankingCategory.findUnique({
      where: { id: ranking.category }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Categoria do ranking não encontrada' },
        { status: 404 }
      )
    }

    // Lê o arquivo CSV
    const fileContent = await file.text()
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    if (!records.length) {
      return NextResponse.json(
        { error: 'Arquivo CSV vazio ou inválido' },
        { status: 400 }
      )
    }

    console.log(`Processando ${records.length} resultados`)

    // Valida e processa cada linha do CSV
    const results = []
    const errors = []

    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      const rowNumber = i + 2 // +2 porque a linha 1 é o cabeçalho

      // Valida os campos obrigatórios
      if (!record.atleta_id || !record.posicao || !record.pontos) {
        errors.push(`Linha ${rowNumber}: Campos obrigatórios ausentes (atleta_id, posicao, pontos)`)
        continue
      }

      // Converte e valida os valores
      const athleteId = record.atleta_id.trim()
      const position = parseInt(record.posicao)
      const points = parseInt(record.pontos)

      if (isNaN(position) || position <= 0) {
        errors.push(`Linha ${rowNumber}: Posição inválida`)
        continue
      }

      if (isNaN(points) || points < 0) {
        errors.push(`Linha ${rowNumber}: Pontos inválidos`)
        continue
      }

      // Verifica se o atleta existe
      const athlete = await prisma.athlete.findUnique({
        where: { id: athleteId }
      })

      if (!athlete) {
        errors.push(`Linha ${rowNumber}: Atleta com ID ${athleteId} não encontrado`)
        continue
      }

      // Cria o objeto de resultado
      results.push({
        id: uuidv4(),
        rankingId,
        athleteId,
        modality: modality.name,
        category: category.name,
        gender: ranking.gender,
        modalityId: modality.id,
        categoryId: category.id,
        stageName,
        position,
        points,
        season,
        date: new Date(date),
        createdAt: new Date()
      })
    }

    // Se houver erros, retorna sem salvar nada
    if (errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Erros encontrados no arquivo CSV', 
          details: errors 
        },
        { status: 400 }
      )
    }

    // Salva os resultados no banco de dados
    if (results.length > 0) {
      await prisma.rankingStageResult.createMany({
        data: results
      })
    }

    console.log(`${results.length} resultados salvos com sucesso`)

    return NextResponse.json({
      success: true,
      message: `${results.length} resultados processados com sucesso`,
      resultsCount: results.length
    })
  } catch (error) {
    console.error('Erro ao processar resultados:', error instanceof Error ? error.message : 'Erro desconhecido')
    return NextResponse.json(
      { error: 'Erro ao processar resultados' },
      { status: 500 }
    )
  }
}
