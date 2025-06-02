import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Rota para testar a atualização direta do campo resultsFile
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Obter o ID do evento da URL
    const { id } = context.params
    
    // Obter a URL do parâmetro de consulta
    const url = new URL(request.url)
    const resultsFileUrl = url.searchParams.get('url') || `https://teste-url-resultados-${Date.now()}.csv`
    
    console.log(`Atualizando resultsFile para o evento com ID: ${id}`)
    console.log(`URL a ser salva: ${resultsFileUrl}`)

    // Verificar o valor atual antes da atualização
    const eventBefore = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        resultsFile: true
      }
    })
    
    console.log('Evento antes da atualização:', eventBefore)

    // Atualizar diretamente usando SQL
    const result = await prisma.$executeRaw`
      UPDATE "Event"
      SET "resultsFile" = ${resultsFileUrl}, "updatedAt" = NOW()
      WHERE "id" = ${id}
    `
    
    console.log('Resultado da atualização SQL:', result)
    
    // Verificar o valor após a atualização
    const eventAfter = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        resultsFile: true
      }
    })
    
    console.log('Evento após a atualização:', eventAfter)

    return NextResponse.json({
      success: true,
      message: 'URL do arquivo de resultados atualizada com sucesso',
      before: eventBefore,
      after: eventAfter
    })
  } catch (error) {
    console.error('Erro na atualização do resultsFile:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar URL do arquivo de resultados' },
      { status: 500 }
    )
  }
}
