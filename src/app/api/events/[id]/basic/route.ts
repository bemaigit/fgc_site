import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

interface PrismaError {
  code?: string;
  message: string;
}

// Schema de validação para atualização
const updateEventSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').optional(),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres').optional(),
  location: z.string().min(3, 'Local deve ter no mínimo 3 caracteres').optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  registrationEnd: z.string().datetime().nullable().optional(),
  published: z.boolean().optional(),
  status: z.string().optional()
})

// Tipo para a resposta final que inclui resultsFile
type EventResponse = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startDate: Date | null;
  endDate: Date | null;
  registrationEnd: Date | null;
  published: boolean;
  status: string;
  category: string | null;
  gender: string;
  isFree: boolean;
  zipCode: string | null;
  city: string | null;
  state: string | null;
  locationUrl: string | null;
  resultsFile: string | null;
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Verificar autenticação (opcional para dados básicos)
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Aguardar e extrair o parâmetro id conforme exigido pelo Next.js
    const { id } = await context.params
    console.log(`Buscando dados básicos do evento com ID: ${id}`)

    // Validação do ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID do evento inválido' },
        { status: 400 }
      )
    }

    try {
      // Buscar todos os dados do evento usando uma única consulta SQL
      // Esta abordagem evita problemas de tipagem do Prisma
      const eventResult = await prisma.$queryRaw`
        SELECT 
          e."id", e."title", e."description", e."location", e."startDate", e."endDate", 
          e."registrationEnd", e."published", e."status", e."category", e."gender", 
          e."isFree", e."zipCode", c."name" as "city", s."name" as "state", e."locationUrl", e."resultsFile"
        FROM "Event" e
        LEFT JOIN "City" c ON e."cityId" = c."id"
        LEFT JOIN "State" s ON e."stateId" = s."id"
        WHERE e."id" = ${id}
      `;

      if (!eventResult || !Array.isArray(eventResult) || eventResult.length === 0) {
        return NextResponse.json(
          { error: 'Evento não encontrado' },
          { status: 404 }
        )
      }

      // Converter para nosso tipo de resposta
      const eventResponse = eventResult[0] as EventResponse;

      console.log('Evento encontrado:', {
        id: eventResponse.id,
        title: eventResponse.title,
        resultsFile: eventResponse.resultsFile
      })

      return NextResponse.json(eventResponse)
    } catch (dbError) {
      console.error('Erro ao consultar o banco de dados:', dbError);
      throw new Error(`Erro de banco de dados: ${dbError instanceof Error ? dbError.message : 'Erro desconhecido'}`);
    }
  } catch (error) {
    console.error('Erro ao buscar dados básicos do evento:', error)
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação', 
        detail: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { id } = context.params

    // Validação do ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID do evento inválido' },
        { status: 400 }
      )
    }

    // Valida o corpo da requisição
    const body = await request.json()
    const validationResult = updateEventSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    // Atualiza apenas os campos fornecidos
    const event = await prisma.event.update({
      where: { id },
      data: validationResult.data,
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        startDate: true,
        endDate: true,
        registrationEnd: true,
        published: true,
        status: true,
        resultsFile: true
      }
    })

    return NextResponse.json({ data: event })
  } catch (error) {
    console.error('Erro ao atualizar informações básicas do evento:', error)
    
    const prismaError = error as PrismaError
    if (prismaError.code === 'P2025') {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
