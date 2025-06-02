import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// Usando o tipo gerado pelo Prisma para incluir NotificationAttempt
type NotificationWithAttempts = Prisma.NotificationGetPayload<{
  include: { NotificationAttempt: true };
}>;

/**
 * API para buscar o histórico de notificações
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter parâmetros de consulta
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const searchTerm = url.searchParams.get('search');

    // Preparar condições de busca
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (searchTerm) {
      where.OR = [
        { id: { contains: searchTerm } },
        { recipient: { contains: searchTerm } }
      ];
    }

    // Buscar total de registros para paginação
    const totalCount = await prisma.notification.count({ where });

    // Buscar notificações com paginação
    let notifications: NotificationWithAttempts[] = [];
    try {
      notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          NotificationAttempt: {
            orderBy: { createdAt: 'desc' },
            take: 1, // Apenas a última tentativa
          }
        }
      });
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      // Continuar mesmo com erro
    }

    // Transformar os dados para o formato esperado pelo frontend
    const formattedNotifications = notifications.map(notification => {
      const attempts = notification.NotificationAttempt?.length || 0;
      const lastAttempt = notification.NotificationAttempt?.[0];
      
      return {
        id: notification.id,
        recipient: notification.recipient,
        status: notification.status,
        type: notification.type,
        priority: notification.priority,
        createdAt: notification.createdAt.toISOString(),
        attempts: attempts,
        // O canal vem da tentativa, não da notificação em si
        channel: lastAttempt?.channel || 'unknown',
        lastAttempt: lastAttempt ? {
          id: lastAttempt.id,
          success: lastAttempt.success,
          error: lastAttempt.error,
          createdAt: lastAttempt.createdAt.toISOString(),
          providerId: lastAttempt.providerId
        } : null
      };
    });

    // Retornar dados paginados
    return NextResponse.json({
      notifications: formattedNotifications,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar histórico de notificações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar histórico de notificações' },
      { status: 500 }
    );
  }
}
