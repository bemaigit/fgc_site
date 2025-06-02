import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Endpoint para obter status de uma notificação específica ou estatísticas gerais
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter ID da notificação da URL
    const url = new URL(req.url);
    const notificationId = url.searchParams.get('id');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Se foi fornecido um ID, retorna status específico
    if (notificationId) {
      try {
        const notification = await prisma.notification.findUnique({
          where: { id: notificationId },
          include: {
            NotificationAttempt: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        });

        if (!notification) {
          return NextResponse.json({ 
            notification: null,
            error: 'Notificação não encontrada' 
          }, { status: 200 }); // Retornar 200 mesmo quando não encontrar
        }

        return NextResponse.json({ notification });
      } catch (error) {
        console.error('Erro ao buscar notificação específica:', error);
        return NextResponse.json({ 
          notification: null,
          error: 'Erro ao buscar notificação'
        }, { status: 200 }); // Retornar 200 mesmo com erro
      }
    }

    // Buscar notificações recentes para o dashboard
    let recentNotifications: Array<{
      id: string;
      type: string;
      recipient: string;
      status: string;
      createdAt: Date;
    }> = [];
    
    let statsData = {
      pending: 0,
      processing: 0,
      delivered: 0,
      failed: 0,
      total: 0,
      failedAttempts: 0,
      deliveryRate: 0,
      growth: 5, // Valor fictício
      deliveryGrowth: 1.2, // Valor fictício 
      activeChannels: 2 // WhatsApp e Email por padrão
    };
    
    try {
      // Tentar buscar notificações reais
      recentNotifications = await prisma.notification.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          recipient: true,
          status: true,
          createdAt: true
        }
      });
      
      // Tentar obter contagens básicas
      const counts = await Promise.all([
        prisma.notification.count({ where: { status: 'pending' } }).catch(() => 0),
        prisma.notification.count({ where: { status: 'processing' } }).catch(() => 0),
        prisma.notification.count({ where: { status: 'delivered' } }).catch(() => 0),
        prisma.notification.count({ where: { status: 'failed' } }).catch(() => 0),
        prisma.notification.count().catch(() => 0)
      ]);
      
      statsData.pending = counts[0];
      statsData.processing = counts[1];
      statsData.delivered = counts[2];
      statsData.failed = counts[3];
      statsData.total = counts[4];
      
      // Calcular taxa de entrega se houver notificações
      if (statsData.total > 0) {
        statsData.deliveryRate = (statsData.delivered / statsData.total) * 100;
      }
    } catch (error) {
      console.error('Erro ao buscar dados do banco:', error);
      // Em caso de erro, usar dados vazios mas continuar a resposta
    }

    // Valores simulados para serviços que podem não estar implementados
    const queueStats = { waiting: 0, active: 0, completed: 0, failed: 0 };
    const whatsappStatus = { connected: false, state: 'unavailable' };

    return NextResponse.json({
      stats: statsData,
      queue: queueStats,
      whatsappStatus,
      recentNotifications
    });
  } catch (error: any) {
    console.error('Erro geral ao obter status:', error);
    // Em caso de erro geral, retornar uma resposta básica que não quebrará o frontend
    return NextResponse.json({ 
      stats: {
        total: 0,
        pending: 0,
        processing: 0,
        delivered: 0,
        failed: 0,
        failedAttempts: 0,
        deliveryRate: 0,
        growth: 0,
        deliveryGrowth: 0,
        activeChannels: 2
      },
      queue: { waiting: 0, active: 0, completed: 0, failed: 0 },
      whatsappStatus: { connected: false, state: 'unavailable' },
      recentNotifications: []
    });
  }
}

/**
 * Endpoint para reiniciar uma notificação com falha
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter ID da notificação do corpo da requisição
    const body = await req.json();
    const notificationId = body.id;

    if (!notificationId) {
      return NextResponse.json({ error: 'ID da notificação é obrigatório' }, { status: 400 });
    }

    try {
      // Buscar a notificação
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 });
      }

      // Atualizar status para pending
      await prisma.notification.update({
        where: { id: notificationId },
        data: { 
          status: 'pending',
          updatedAt: new Date()
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Notificação reiniciada com sucesso' 
      });
    } catch (error) {
      console.error('Erro ao processar a notificação:', error);
      return NextResponse.json({ 
        error: 'Erro ao reiniciar notificação', 
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Erro ao reiniciar notificação:', error);
    return NextResponse.json({ 
      error: 'Erro ao reiniciar notificação', 
      message: error.message 
    }, { status: 500 });
  }
}

/**
 * Endpoint para cancelar uma notificação pendente
 */
export async function DELETE(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter ID da notificação da URL
    const url = new URL(req.url);
    const notificationId = url.searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json({ error: 'ID da notificação é obrigatório' }, { status: 400 });
    }

    try {
      // Buscar a notificação
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 });
      }

      // Atualizar status para canceled
      await prisma.notification.update({
        where: { id: notificationId },
        data: { 
          status: 'canceled',
          updatedAt: new Date()
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Notificação cancelada com sucesso' 
      });
    } catch (error) {
      console.error('Erro ao cancelar notificação:', error);
      return NextResponse.json({ 
        error: 'Erro ao cancelar notificação', 
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Erro ao cancelar notificação:', error);
    return NextResponse.json({ 
      error: 'Erro ao cancelar notificação', 
      message: error.message 
    }, { status: 500 });
  }
}
