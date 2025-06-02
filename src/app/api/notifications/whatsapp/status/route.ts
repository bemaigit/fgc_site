import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import WhatsAppAdapter from '@/lib/notifications/adapters/whatsapp-adapter';

/**
 * Endpoint para verificar o status da conexão do WhatsApp
 * GET /api/notifications/whatsapp/status
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const whatsappAdapter = new WhatsAppAdapter();
    
    try {
      const status = await whatsappAdapter.checkConnectionStatus();
      
      return NextResponse.json({
        success: true,
        connected: status.connected,
        phoneNumber: status.phoneNumber || '',
        state: status.state || 'unknown',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Erro ao verificar status do WhatsApp:', error);
      return NextResponse.json({
        success: false,
        connected: false,
        error: error.message,
        state: 'error',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error: any) {
    console.error('Erro na requisição:', error);
    return NextResponse.json({ 
      error: 'Erro ao processar requisição',
      message: error.message 
    }, { status: 500 });
  }
}
