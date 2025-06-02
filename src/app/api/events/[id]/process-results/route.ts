import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { processResultFile, saveTopResults } from '@/services/resultProcessor';

// POST: Processar arquivo de resultados
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const session = await getServerSession(authOptions);
    
    // Verificar autenticação
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Verificar se o evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }
    
    // Obter o arquivo do FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não fornecido' },
        { status: 400 }
      );
    }
    
    // Verificar tipo de arquivo
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/csv',
      'application/excel',
      'application/x-excel',
      'application/x-msexcel',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não suportado. Use CSV ou Excel.' },
        { status: 400 }
      );
    }
    
    // Converter o arquivo para Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Processar o arquivo
    const processedResults = await processResultFile(buffer, file.type, eventId);
    
    // Salvar os resultados processados
    await saveTopResults(eventId, processedResults);
    
    return NextResponse.json({
      success: true,
      data: processedResults,
      message: `Processados ${processedResults.length} resultados destacados de ${file.name}`,
    });
  } catch (error) {
    console.error('Erro ao processar arquivo de resultados:', error);
    return NextResponse.json(
      { error: 'Erro ao processar arquivo de resultados', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// GET: Obter prévia dos resultados processados sem salvar
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const session = await getServerSession(authOptions);
    
    // Verificar autenticação
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Verificar se o evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se o evento tem um arquivo de resultados
    const eventData = event as any;
    if (!eventData.resultsFile) {
      return NextResponse.json(
        { error: 'Este evento não possui arquivo de resultados' },
        { status: 404 }
      );
    }
    
    // Obter os resultados destacados existentes
    const topResults = await prisma.eventTopResult.findMany({
      where: { eventId },
      orderBy: [
        { categoryId: 'asc' },
        { position: 'asc' },
      ],
      include: {
        EventCategory: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        Club: {
          select: {
            id: true,
            clubName: true,
          },
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      data: topResults,
    });
  } catch (error) {
    console.error('Erro ao obter prévia dos resultados:', error);
    return NextResponse.json(
      { error: 'Erro ao obter prévia dos resultados', details: (error as Error).message },
      { status: 500 }
    );
  }
}
