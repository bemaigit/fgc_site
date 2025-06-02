import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Buscar total de filiados (atletas)
    const totalAthletes = await prisma.athlete.count({
      where: {
        active: true
      }
    });

    // Buscar eventos ativos (que não terminaram ainda)
    const currentDate = new Date();
    const activeEvents = await prisma.event.count({
      where: {
        published: true,
        endDate: {
          gte: currentDate
        }
      }
    });

    // Buscar total de notícias publicadas
    const publishedNews = await prisma.news.count({
      where: {
        published: true
      }
    });

    // Buscar total de documentos
    const documents = await prisma.document.count();

    return NextResponse.json({
      success: true,
      data: {
        totalAthletes,
        activeEvents,
        publishedNews,
        documents
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}
