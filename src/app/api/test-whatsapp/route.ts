import { NextResponse } from 'next/server';
import WhatsAppAdapter from '@/lib/notifications/adapters/whatsapp-adapter';

export async function POST(request: Request) {
  try {
    // Extrai os dados do corpo da requisição
    const data = await request.json();
    const { phoneNumber, message } = data;

    if (!phoneNumber || !message) {
      return NextResponse.json({ 
        error: 'Parâmetros inválidos. Forneça phoneNumber e message.', 
        received: data 
      }, { status: 400 });
    }

    console.log(`=== INICIANDO TESTE DE WHATSAPP ===`);
    console.log(`Telefone: ${phoneNumber}`);
    console.log(`Mensagem: ${message}`);

    // Teste direto usando o adaptador
    const adapter = new WhatsAppAdapter();
    
    // Verificar status da conexão
    console.log('Status da conexão:');
    const statusResult = await adapter.checkConnectionStatus();
    console.log(JSON.stringify(statusResult, null, 2));

    if (!statusResult.success || !statusResult.isConnected) {
      return NextResponse.json({
        error: 'Instância do WhatsApp não está conectada',
        connectionStatus: statusResult,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Enviar mensagem de teste
    console.log('Enviando mensagem via adaptador:');
    const result = await adapter.sendTextMessage(phoneNumber, message);
    console.log('Resultado do envio:', JSON.stringify(result, null, 2));

    return NextResponse.json({
      success: result.success,
      connectionStatus: statusResult,
      messageResult: result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Erro no teste de WhatsApp:', error);
    return NextResponse.json({ 
      error: 'Erro ao enviar mensagem de teste',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
