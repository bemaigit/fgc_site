import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Buscar as atividades mais recentes do sistema
    // Podemos combinar diferentes tipos de atividades
    
    // Últimas inscrições em eventos
    const recentRegistrations = await prisma.registration.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        // Usar os nomes corretos dos relacionamentos conforme definidos no schema Prisma
        User: true,
        Event: {
          select: {
            title: true
          }
        }
      }
    });
    
    // Últimas filiações
    const recentMemberships = await prisma.athlete.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        User_Athlete_userIdToUser: {
          select: {
            name: true
          }
        }
      }
    });
    
    // Formato as atividades recentes em um único formato
    const registrationActivities = recentRegistrations.map(registration => ({
      type: 'registration',
      title: `Inscrição em evento`,
      description: `${registration.User?.name || 'Usuário'} se inscreveu em ${registration.Event?.title || 'evento'}`,
      date: registration.createdAt,
    }));
    
    const membershipActivities = recentMemberships.map(athlete => ({
      type: 'membership',
      title: `Nova filiação`,
      description: `${athlete.User_Athlete_userIdToUser?.name || 'Atleta'} se filiou à federação`,
      date: athlete.createdAt,
    }));
    
    // Combinar todas as atividades e ordenar por data (mais recentes primeiro)
    const activities = [...registrationActivities, ...membershipActivities]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10); // Limitar a 10 atividades
    
    return NextResponse.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Erro ao buscar atividades recentes:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar atividades recentes' },
      { status: 500 }
    );
  }
}
