import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    console.log('API: Recebendo requisição GET para buscar gêneros')

    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log('API: Requisição não autorizada')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Obter parâmetros da query
    const url = new URL(request.url)
    const activeOnly = url.searchParams.get('active') === 'true'
    console.log('API: Parâmetro active:', activeOnly)

    // Buscar gêneros
    const genders = await prisma.gender.findMany({
      where: activeOnly ? { active: true } : {},
      orderBy: {
        name: 'asc'
      }
    })

    console.log(`API: ${genders.length} gêneros encontrados`)
    return NextResponse.json({
      success: true,
      data: genders
    })
  } catch (error) {
    console.error('Erro ao buscar gêneros:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
