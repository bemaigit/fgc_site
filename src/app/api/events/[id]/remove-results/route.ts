import { NextRequest, NextResponse } from 'next/server'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Função para remover o arquivo de resultados do MinIO e limpar a URL no banco de dados
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Aguardar o parâmetro conforme exigido pelo Next.js
    const { id } = await params
    console.log('Iniciando processo de remoção de resultados para o evento:', id)
    
    // Verificar autenticação do usuário
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      console.log('Autenticação falhou - usuário não autenticado')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    // Obter o ID do evento
    const eventId = id
    if (!eventId) {
      console.log('ID do evento não fornecido')
      return NextResponse.json({ error: 'ID do evento não fornecido' }, { status: 400 })
    }
    
    console.log('Buscando evento no banco de dados, ID:', eventId)
    
    // Buscar a URL do arquivo diretamente usando uma consulta SQL
    let resultsFileUrl: string | null = null
    try {
      // Usar uma consulta SQL direta para evitar problemas de tipagem com o Prisma
      const result = await prisma.$queryRaw`SELECT "resultsFile" FROM "Event" WHERE "id" = ${eventId}`
      console.log('Resultado da consulta SQL:', result)
      
      if (Array.isArray(result) && result.length > 0) {
        // Verificar se o valor é a string "NULL" e tratá-lo como null
        resultsFileUrl = result[0].resultsFile === 'NULL' ? null : result[0].resultsFile
        console.log('URL do arquivo de resultados:', resultsFileUrl)
      } else {
        console.log('Evento não encontrado no banco de dados')
        return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
      }
    } catch (sqlError) {
      console.error('Erro ao consultar o banco de dados:', sqlError)
      return NextResponse.json({ 
        error: 'Erro ao consultar o banco de dados',
        detail: sqlError instanceof Error ? sqlError.message : 'Erro desconhecido'
      }, { status: 500 })
    }
    
    // Se não houver arquivo de resultados, retornar sucesso imediatamente
    if (!resultsFileUrl) {
      console.log('Nenhum arquivo de resultados para remover')
      return NextResponse.json({ 
        message: 'Nenhum arquivo de resultados para remover'
      }, { status: 200 })
    }
    
    // Iniciar cliente S3 para MinIO
    console.log('Configurando cliente S3 com:', {
      region: process.env.S3_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
      bucket: process.env.S3_BUCKET || 'fgc'
    })
    
    const s3Client = new S3Client({
      region: process.env.S3_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || ''
      },
      forcePathStyle: true
    })
    
    // Extrair a chave do objeto da URL do arquivo
    console.log('URL do arquivo a ser processada:', resultsFileUrl)
    let objectKey
    
    try {
      const url = new URL(resultsFileUrl)
      const pathname = url.pathname
      console.log('Caminho extraído da URL:', pathname)
      
      // Remover a parte inicial da URL (ex: /fgc/) para obter a chave do objeto
      objectKey = pathname.startsWith('/') ? pathname.substring(1) : pathname
      
      // Se o caminho contiver o nome do bucket, remover essa parte
      const bucket = process.env.S3_BUCKET || 'fgc'
      if (objectKey.startsWith(bucket + '/')) {
        objectKey = objectKey.substring(bucket.length + 1)
      }
      
      console.log('Chave do objeto calculada:', objectKey)
    } catch (urlError) {
      console.error('Erro ao processar URL do arquivo:', urlError)
      return NextResponse.json({ 
        error: 'URL do arquivo inválida',
        detail: urlError instanceof Error ? urlError.message : 'Erro desconhecido'
      }, { status: 400 })
    }
    
    // Tentar excluir o arquivo do MinIO
    try {
      const bucket = process.env.S3_BUCKET || 'fgc'
      console.log(`Tentando excluir arquivo "${objectKey}" do bucket "${bucket}"`)
      
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: objectKey
      })
      
      const deleteResult = await s3Client.send(command)
      console.log('Comando de exclusão enviado, resposta:', deleteResult)
      console.log('Arquivo removido com sucesso do MinIO')
    } catch (s3Error) {
      console.error('Erro ao remover arquivo do MinIO:', s3Error)
      // Não retornar erro aqui, pois queremos continuar e atualizar o banco de dados de qualquer forma
    }
    
    // Atualizar o banco de dados para limpar a URL do arquivo
    try {
      console.log('Atualizando banco de dados para remover a URL')
      
      // Usar SQL direto para evitar problemas de tipagem
      const result = await prisma.$executeRaw`
        UPDATE "Event"
        SET "resultsFile" = NULL, "updatedAt" = NOW()
        WHERE "id" = ${eventId}
      `
      
      console.log('Banco de dados atualizado, registros afetados:', result)
      
      // IMPORTANTE: Limpar também a tabela EventTopResult
      console.log('Removendo resultados salvos da tabela EventTopResult')
      const deleteResults = await prisma.$executeRaw`
        DELETE FROM "EventTopResult"
        WHERE "eventId" = ${eventId}
      `
      console.log('Resultados removidos da tabela EventTopResult, registros afetados:', deleteResults)
      
      // Verificar se a atualização foi bem-sucedida
      const checkResult = await prisma.$queryRaw`SELECT "resultsFile" FROM "Event" WHERE "id" = ${eventId}`
      console.log('Verificação pós-atualização:', checkResult)
    } catch (dbError) {
      console.error('Erro ao atualizar o banco de dados:', dbError)
      return NextResponse.json({ 
        error: 'Erro ao atualizar o banco de dados',
        detail: dbError instanceof Error ? dbError.message : 'Erro desconhecido'
      }, { status: 500 })
    }
    
    console.log('Processo de remoção concluído com sucesso')
    return NextResponse.json({ 
      message: 'Arquivo de resultados removido com sucesso'
    }, { status: 200 })
    
  } catch (error) {
    console.error('Erro geral na remoção de resultados:', error)
    return NextResponse.json({ 
      error: 'Erro ao processar a solicitação',
      detail: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
