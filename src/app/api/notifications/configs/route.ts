import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import WhatsAppAdapter from '@/lib/notifications/adapters/whatsapp-adapter';

/**
 * Endpoint para obter configurações de notificação
 * GET /api/notifications/configs
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar configurações do banco de dados
    const notificationConfig = await prisma.notificationConfig.findFirst({
      where: { id: 'default-config' }
    }) || {
      id: 'default-config',
      whatsappEnabled: false,
      emailEnabled: true,
      webhookEnabled: false,
      whatsappToken: null,
      whatsappPhoneId: null,
      webhookUrl: null,
      maxRetries: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Buscar status da conexão WhatsApp
    let whatsappStatus = { connected: false, phoneNumber: '', state: 'disconnected' };
    try {
      const whatsappAdapter = new WhatsAppAdapter();
      const status = await whatsappAdapter.checkConnectionStatus();
      whatsappStatus = {
        connected: status.connected,
        phoneNumber: status.phoneNumber || '',
        state: status.state
      };
    } catch (error) {
      console.error('Erro ao verificar status do WhatsApp:', error);
    }

    // Configurações gerais (valores padrão se não existirem no banco)
    const generalConfig = {
      defaultChannel: process.env.NOTIFICATION_DEFAULT_CHANNEL || 'whatsapp',
      maxRetries: notificationConfig.maxRetries || parseInt(process.env.NOTIFICATION_MAX_RETRIES || '3', 10),
      retryInterval: parseInt(process.env.NOTIFICATION_RETRY_INTERVAL || '300', 10),
      batchSize: parseInt(process.env.NOTIFICATION_BATCH_SIZE || '50', 10),
      batchDelay: parseInt(process.env.NOTIFICATION_BATCH_DELAY || '5', 10)
    };

    return NextResponse.json({
      whatsapp: {
        enabled: notificationConfig.whatsappEnabled,
        provider: 'meow',
        apiUrl: process.env.WHATSAPP_API_URL || 'http://localhost:8080',
        apiKey: notificationConfig.whatsappToken || process.env.WHATSAPP_WEBHOOK_SECRET || '********',
        instanceName: process.env.WHATSAPP_INSTANCE || 'federacao',
        webhookEnabled: notificationConfig.webhookEnabled,
        webhookUrl: notificationConfig.webhookUrl || process.env.WEBHOOK_URL || '',
        status: whatsappStatus.connected ? 'connected' : 'disconnected',
        phoneNumber: notificationConfig.whatsappPhoneId || whatsappStatus.phoneNumber || '',
        connectionState: whatsappStatus.state || 'unknown'
      },
      email: {
        enabled: notificationConfig.emailEnabled,
        provider: 'smtp',
        host: process.env.EMAIL_HOST || '',
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        user: process.env.EMAIL_USER || '',
        password: '********', // Nunca retornar a senha real
        fromName: process.env.EMAIL_FROM_NAME || '',
        fromEmail: process.env.EMAIL_FROM_EMAIL || '',
        status: notificationConfig.emailEnabled ? 'connected' : 'disconnected'
      },
      general: generalConfig
    });
  } catch (error) {
    console.error('Erro ao obter configurações:', error);
    return NextResponse.json({ error: 'Erro ao obter configurações' }, { status: 500 });
  }
}

/**
 * Endpoint para salvar configurações
 * POST /api/notifications/configs
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar permissão (ADMIN ou SUPER_ADMIN)
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Obter dados
    const data = await req.json();
    
    // Atualizações
    const updates: any = {
      updatedAt: new Date()
    };
    
    // Configuração do WhatsApp
    if (data.whatsapp) {
      updates.whatsappEnabled = data.whatsapp.enabled;
      updates.whatsappToken = data.whatsapp.apiKey !== '********' ? data.whatsapp.apiKey : undefined;
      updates.whatsappPhoneId = data.whatsapp.phoneNumber || undefined;
      updates.webhookEnabled = data.whatsapp.webhookEnabled;
      updates.webhookUrl = data.whatsapp.webhookUrl || undefined;
    }

    // Configuração do Email (mantida no .env)
    if (data.email) {
      updates.emailEnabled = data.email.enabled;
    }

    // Configurações gerais
    if (data.general) {
      updates.maxRetries = data.general.maxRetries;
    }

    // Salvar no banco de dados - upsert para criar se não existir
    const updatedConfig = await prisma.notificationConfig.upsert({
      where: { id: 'default-config' },
      update: updates,
      create: {
        id: 'default-config',
        whatsappEnabled: data.whatsapp?.enabled || false,
        emailEnabled: data.email?.enabled || true,
        webhookEnabled: data.whatsapp?.webhookEnabled || false,
        whatsappToken: data.whatsapp?.apiKey !== '********' ? data.whatsapp?.apiKey : null,
        whatsappPhoneId: data.whatsapp?.phoneNumber || null,
        webhookUrl: data.whatsapp?.webhookUrl || null,
        maxRetries: data.general?.maxRetries || 3,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso',
      config: {
        id: updatedConfig.id,
        whatsappEnabled: updatedConfig.whatsappEnabled,
        emailEnabled: updatedConfig.emailEnabled,
        webhookEnabled: updatedConfig.webhookEnabled,
        maxRetries: updatedConfig.maxRetries,
        updatedAt: updatedConfig.updatedAt
      }
    });
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
  }
}
