import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parse } from 'csv-parse/sync'
import { randomUUID } from 'crypto'

interface AthleteRecord {
  atleta: string
  posicao: string
  pontos: string
  modalidade?: string
  categoria?: string
  genero?: string
  cidade?: string
  equipe?: string
}

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verifica se é admin ou super_admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem fazer upload de atletas.' },
        { status: 403 }
      )
    }

    // Pega o formulário
    const formData = await request.formData()
    const file = formData.get('file') as File
    const modalityId = formData.get('modalityId') as string
    const categoryId = formData.get('categoryId') as string
    const gender = formData.get('gender') as string

    // Validações básicas
    if (!file) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 400 })
    }

    // Lê o arquivo CSV
    const buffer = await file.arrayBuffer()
    const fileContent = new TextDecoder().decode(buffer)
    
    // Processa o arquivo CSV
    let records: AthleteRecord[] = []
    
    try {
      // Usamos o método síncrono para simplificar
      const parsedRecords = parse(fileContent, {
        delimiter: ',',
        columns: true,
        skip_empty_lines: true
      }) as Record<string, string>[]
      
      // Mapeia os registros para o formato esperado
      records = parsedRecords.map(record => ({
        atleta: record.atleta || record.nome || record.name || '',
        posicao: record.posicao || record.position || '0',
        pontos: record.pontos || record.points || '0',
        modalidade: record.modalidade || record.modality || '',
        categoria: record.categoria || record.category || '',
        genero: record.genero || record.gender || gender || '',
        cidade: record.cidade || record.city || '',
        equipe: record.equipe || record.team || ''
      }))
    } catch (error) {
      console.error('Erro ao processar CSV:', error)
      return NextResponse.json({
        error: `Erro ao processar o arquivo CSV: ${error instanceof Error ? error.message : 'Formato inválido'}`
      }, { status: 400 })
    }

    if (records.length === 0) {
      return NextResponse.json({
        error: 'Nenhum registro válido encontrado no arquivo CSV'
      }, { status: 400 })
    }

    // Resultados do processamento
    const results = {
      success: 0,
      errors: 0,
      details: [] as Array<{
        record: AthleteRecord,
        error?: string,
        success?: boolean,
        athleteId?: string
      }>
    }

    // Processa cada atleta
    for (const record of records) {
      try {
        // Valida os dados básicos
        if (!record.atleta) {
          results.errors++
          results.details.push({
            record,
            error: 'Nome do atleta não informado'
          })
          continue
        }

        // Determina a modalidade a ser usada
        let modalityToUse = modalityId
        let categoryToUse = categoryId
        const genderToUse = gender || record.genero || 'MASCULINO'

        // Se o CSV tiver modalidade e categoria, busca os IDs correspondentes
        if (record.modalidade && !modalityId) {
          const modality = await prisma.rankingModality.findFirst({
            where: { name: record.modalidade }
          })
          
          if (modality) {
            modalityToUse = modality.id
          } else {
            results.errors++
            results.details.push({
              record,
              error: `Modalidade '${record.modalidade}' não encontrada`
            })
            continue
          }
        }

        if (record.categoria && !categoryId) {
          const category = await prisma.rankingCategory.findFirst({
            where: { 
              name: record.categoria,
              ...(modalityToUse ? { modalityId: modalityToUse } : {})
            }
          })
          
          if (category) {
            categoryToUse = category.id
          } else {
            results.errors++
            results.details.push({
              record,
              error: `Categoria '${record.categoria}' não encontrada`
            })
            continue
          }
        }

        // Verifica se temos modalidade e categoria
        if (!modalityToUse || !categoryToUse) {
          results.errors++
          results.details.push({
            record,
            error: 'Modalidade ou categoria não informada'
          })
          continue
        }

        // Gera um ID único para o usuário (temporário)
        const tempUserId = randomUUID()
        
        // Cria um usuário temporário para associar ao atleta
        const user = await prisma.user.create({
          data: {
            id: tempUserId,
            email: `temp_${tempUserId}@example.com`,
            name: record.atleta,
            role: 'USER',
            password: randomUUID()
          }
        })

        // Cria o atleta
        const athlete = await prisma.athlete.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            fullName: record.atleta,
            cpf: `temp_${Date.now()}_${results.success}`, // CPF temporário único
            birthDate: new Date(),
            address: "Endereço não informado",
            city: record.cidade || "Cidade não informada",
            state: "Estado não informado",
            zipCode: "00000-000",
            phone: "Não informado",
            modalities: [record.modalidade || ""],
            category: record.categoria || "",
            paymentStatus: "PAID",
            active: true,
            updatedAt: new Date()
          }
        })

        // Busca a configuração de ranking correspondente
        const rankingConfig = await prisma.rankingConfiguration.findFirst({
          where: {
            modalityId: modalityToUse,
            categoryId: categoryToUse,
            gender: genderToUse
          }
        })

        // Se não existir configuração, cria uma nova
        let configId = rankingConfig?.id
        if (!configId) {
          const newConfig = await prisma.rankingConfiguration.create({
            data: {
              id: randomUUID(),
              name: `Ranking ${genderToUse}`,
              modalityId: modalityToUse,
              categoryId: categoryToUse,
              gender: genderToUse,
              season: new Date().getFullYear(),
              active: true,
              updatedAt: new Date()
            }
          })
          configId = newConfig.id
        }

        // Cria a entrada no ranking
        await prisma.rankingEntry.create({
          data: {
            id: randomUUID(),
            athleteId: athlete.id,
            configurationId: configId,
            points: parseInt(record.pontos) || 0,
            position: parseInt(record.posicao) || 0,
            city: record.cidade || "Cidade não informada",
            team: record.equipe || null,
            updatedAt: new Date()
          }
        })

        results.success++
        results.details.push({
          record,
          success: true,
          athleteId: athlete.id
        })
      } catch (error) {
        console.error('Erro ao processar registro:', error)
        results.errors++
        results.details.push({
          record,
          error: `Erro interno: ${(error as Error).message}`
        })
      }
    }

    return NextResponse.json({
      success: true,
      count: results.success,
      errors: results.errors,
      details: results.details
    })
  } catch (error) {
    console.error('Erro ao processar upload de atletas:', error)
    return NextResponse.json(
      { error: 'Erro ao processar upload de atletas' },
      { status: 500 }
    )
  }
}
