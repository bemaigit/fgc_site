import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Consulta simplificada, apenas buscando IDs
    const events = await prisma.event.findMany({
      select: {
        id: true
      },
      take: 5
    })
    
    return NextResponse.json({ count: events.length, ids: events.map(e => e.id) })
  } catch (error) {
    console.error('Erro ao testar consulta de eventos:', error)
    
    // Detalhes do erro para debug
    const errorDetails = error instanceof Error 
      ? { message: error.message, name: error.name } 
      : { message: 'Erro desconhecido' }
    
    return NextResponse.json({ error: 'Erro no teste', details: errorDetails }, { status: 500 })
  }
}
