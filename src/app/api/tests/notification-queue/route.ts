import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { INotificationPayload } from '@/lib/notifications/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * API para testar o sistema de filas de notificação
 * Acesse: http://localhost:3000/api/tests/notification-queue
 */
export async function GET(req: NextRequest) {
  try {
    // Obter parâmetros da URL para personalizar o teste
    const searchParams = req.nextUrl.searchParams;
    const phone = searchParams.get('phone') || '553199999999'; 
    const message = searchParams.get('message') || `Teste de notificação - ${new Date().toLocaleTimeString()}`;
    const channel = searchParams.get('channel') || 'whatsapp';

    // Criar uma notificação de teste diretamente no banco de dados
    const notificationId = uuidv4();
    
    // Criar registro da notificação
    const notification = await prisma.notification.create({
      data: {
        id: notificationId,
        type: 'TEST',
        recipient: phone,
        priority: 'normal',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // Registrar tentativa
    const attemptId = `${notificationId}_attempt_${Date.now()}`;
    await prisma.notificationAttempt.create({
      data: {
        id: attemptId,
        notificationId,
        channel,
        success: false,
        error: null,
        providerId: null,
        createdAt: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Notificação adicionada à fila com sucesso',
      notificationId,
      recipient: phone,
      channel,
      content: message
    });
  } catch (error: any) {
    console.error('Erro no teste da fila de notificações:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
