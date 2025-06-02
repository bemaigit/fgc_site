import { NextRequest, NextResponse } from 'next/server'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { prisma } from '@/lib/prisma'

// Endpoint de teste para diagnosticar problemas na remoção de resultados
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Aguardar o parâmetro conforme exigido pelo Next.js
    const { id } = await params
    
    // Obter o ID do evento
    const eventId = id
    if (!eventId) {
      return NextResponse.json({ error: 'ID do evento não fornecido' }, { status: 400 })
    }
    
    // Diagnóstico inicial
    const diagnostics = {
      eventId,
      s3Config: {
        region: process.env.S3_REGION || 'us-east-1',
        endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
        accessKeyId: process.env.S3_ACCESS_KEY ? '[PRESENTE]' : '[AUSENTE]',
        secretAccessKey: process.env.S3_SECRET_KEY ? '[PRESENTE]' : '[AUSENTE]',
        bucket: process.env.S3_BUCKET || 'fgc'
      },
      event: null as any,
      resultsFile: null as string | null,
      s3Error: null as string | null,
      dbUpdateResult: null as any
    }
    
    // 1. Buscar informações atuais do evento
    try {
      const result = await prisma.$queryRaw`SELECT "id", "resultsFile" FROM "Event" WHERE "id" = ${eventId}`
      if (Array.isArray(result) && result.length > 0) {
        diagnostics.event = result[0]
        
        // Verificar se o valor é a string "NULL" e tratá-lo como null
        const rawValue = result[0].resultsFile;
        diagnostics.resultsFile = rawValue === 'NULL' ? null : rawValue
      } else {
        return NextResponse.json({ 
          error: 'Evento não encontrado',
          diagnostics
        }, { status: 404 })
      }
    } catch (dbError) {
      return NextResponse.json({ 
        error: 'Erro ao consultar o banco de dados',
        detail: dbError instanceof Error ? dbError.message : 'Erro desconhecido',
        diagnostics
      }, { status: 500 })
    }
    
    // Se não houver arquivo para remover, simplesmente retornar
    if (!diagnostics.resultsFile) {
      return NextResponse.json({ 
        message: 'Não há arquivo para remover',
        diagnostics
      })
    }
    
    // 2. Testar a atualização do banco de dados (sem executar)
    try {
      // Apenas mostrar a consulta que seria executada, sem realmente executá-la
      const updateQuery = `
        UPDATE "Event"
        SET "resultsFile" = NULL, "updatedAt" = NOW()
        WHERE "id" = '${eventId}'
      `
      diagnostics.dbUpdateResult = {
        query: updateQuery,
        wouldRun: true
      }
    } catch (updateError) {
      diagnostics.dbUpdateResult = {
        error: updateError instanceof Error ? updateError.message : 'Erro desconhecido',
        wouldRun: false
      }
    }
    
    // 3. Extrair informações do arquivo de resultados
    let fileInfo = null
    if (diagnostics.resultsFile) {
      try {
        const url = new URL(diagnostics.resultsFile)
        const pathname = url.pathname
        let objectKey = pathname.startsWith('/') ? pathname.substring(1) : pathname
        
        // Se o caminho contiver o nome do bucket, remover essa parte
        const bucket = process.env.S3_BUCKET || 'fgc'
        if (objectKey.startsWith(bucket + '/')) {
          objectKey = objectKey.substring(bucket.length + 1)
        }
        
        fileInfo = {
          url: diagnostics.resultsFile,
          pathname,
          objectKey,
          bucket
        }
      } catch (urlError) {
        fileInfo = {
          url: diagnostics.resultsFile,
          error: urlError instanceof Error ? urlError.message : 'Erro ao processar URL'
        }
      }
    }
    
    // 4. Testar conexão com MinIO (sem excluir o arquivo)
    if (fileInfo && !fileInfo.error) {
      try {
        const s3Client = new S3Client({
          region: process.env.S3_REGION || 'us-east-1',
          endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY || '',
            secretAccessKey: process.env.S3_SECRET_KEY || ''
          },
          forcePathStyle: true
        })
        
        // Testar apenas se o cliente foi criado com sucesso
        diagnostics.s3Error = null
        
        // Não vamos realmente enviar o comando DeleteObject aqui,
        // apenas mostrar o que seria feito
      } catch (s3Error) {
        diagnostics.s3Error = s3Error instanceof Error ? s3Error.message : 'Erro ao criar cliente S3'
      }
    }
    
    // Retornar todos os diagnósticos para análise
    return NextResponse.json({ 
      message: 'Diagnóstico de remoção de arquivos concluído',
      fileInfo,
      diagnostics
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Erro geral no diagnóstico',
      detail: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
