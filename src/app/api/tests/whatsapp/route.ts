import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import WhatsAppAdapter from '@/lib/notifications/adapters/whatsapp-adapter';

/**
 * Endpoint para testar envio de mensagem WhatsApp
 * POST /api/tests/whatsapp
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter dados do body
    const { phone, message } = await req.json();
    
    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Número de telefone e mensagem são obrigatórios' }, 
        { status: 400 }
      );
    }

    // Testar envio de mensagem
    const whatsapp = new WhatsAppAdapter();
    const result = await whatsapp.sendTextMessage(phone, message);
    
    console.log('Resultado do teste de envio:', result);
    
    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Mensagem enviada com sucesso' : 'Falha ao enviar mensagem',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Erro ao testar envio de WhatsApp:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao testar envio de WhatsApp' }, 
      { status: 500 }
    );
  }
}
