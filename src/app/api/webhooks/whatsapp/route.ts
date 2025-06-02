import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

type WebhookEvent = {
  event: string;
  instance: string;
  data: any;
  session?: string;
  timestamp?: number;
};

// Função para verificar a assinatura do webhook
function verifySignature(payload: string, signature: string, secret: string, apiKey: string): boolean {
  if (!signature) {
    console.error('Assinatura não fornecida na requisição');
    return false;
  }
  
  try {
    // Verificação tradicional usando HMAC SHA-256
    if (signature.startsWith('sha256=')) {
      const hmac = crypto.createHmac('sha256', secret);
      const digest = hmac.update(payload).digest('hex');
      const expectedSignature = `sha256=${digest}`;
      
      // Comparação segura contra ataques de tempo
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      );
    } 
    // Verificação da API key para compatibilidade com Evolution API
    else {
      // Verificar tanto com o WEBHOOK_SECRET quanto com o API_KEY para maior flexibilidade
      return signature === secret || signature === apiKey;
    }
  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    return false;
  }
}

// Função para processar eventos de conexão
async function handleConnectionEvent(event: WebhookEvent) {
  const { instance, data } = event;
  console.log(`[${instance}] Status da conexão atualizado:`, data.status, '- Estado:', data.state);
  
  // Aqui você pode adicionar lógica para notificar o frontend sobre mudanças de estado
  // por exemplo, usando WebSockets ou Server-Sent Events (SSE)
  
  // Se houver um QR Code, podemos logar ou enviar para o frontend
  if (data.qrcode) {
    console.log(`[${instance}] Novo QR Code gerado`);
    // Aqui você pode implementar a lógica para notificar o frontend sobre o novo QR Code
  }
}

// Função para processar mensagens recebidas
async function handleMessageEvent(event: WebhookEvent) {
  const { instance, data } = event;
  
  // Ignorar mensagens de saída (enviadas por nós)
  if (data.key?.fromMe) return;
  
  console.log(`[${instance}] Nova mensagem recebida de ${data.key?.remoteJid}:`, data.message);
  
  // Aqui você pode adicionar lógica para processar a mensagem recebida
  // Por exemplo, salvar no banco de dados, enviar notificação, etc.
  
  try {
    const senderName = data.pushName || data.key?.remoteJid?.split('@')[0] || 'Contato desconhecido';
    const messageContent = data.message?.conversation || data.message?.extendedTextMessage?.text || '[Mídia ou mensagem não suportada]';
    
    await prisma.notification.create({
      data: {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'WHATSAPP_MESSAGE',
        recipient: 'admin', // Ou o ID do destinatário apropriado
        status: 'delivered',
        updatedAt: new Date(),
        NotificationAttempt: {
          create: {
            id: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            channel: 'WHATSAPP',
            success: true,
            providerId: data.key?.id,
          },
        },
      },
    });
    
    console.log(`[${instance}] Notificação salva para mensagem de ${senderName}`);
  } catch (error) {
    console.error('Erro ao salvar notificação:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Obter o corpo da requisição como texto para validação
    const payload = await request.text();
    // Verificar primeiro o cabeçalho x-hub-signature-256 (padrão webhook)
    let signature = request.headers.get('x-hub-signature-256') || '';
    const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
    const apiKey = process.env.WHATSAPP_API_KEY;
    
    if (!webhookSecret) {
      console.error('WHATSAPP_WEBHOOK_SECRET não está configurado no ambiente');
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500 }
      );
    }
    
    // Log para depuração (remover em produção)
    console.log('Headers recebidos:', Object.fromEntries(request.headers.entries()));
    console.log('Assinatura recebida:', signature);
    
    // Para compatibilidade com Evolution API, verificar apikey no payload
    if (!signature) {
      try {
        const jsonPayload = JSON.parse(payload);
        if (jsonPayload.apikey) {
          console.log('Usando apikey do payload para autenticação');
          signature = jsonPayload.apikey;
          console.log('Valor da apikey encontrada:', signature);
          console.log('Valor esperado (WHATSAPP_API_KEY):', apiKey);
        }
      } catch (e) {
        console.error('Erro ao analisar payload para extrair apikey:', e);
      }
    }
    
    // Log do payload recebido
    console.log('Payload recebido:', payload);
    
    // Validar a assinatura do webhook
    const isSignatureValid = verifySignature(payload, signature, webhookSecret, apiKey || '');
    if (!isSignatureValid) {
      console.error('Assinatura do webhook inválida');
      return NextResponse.json(
        { 
          error: 'Assinatura inválida',
          details: 'A assinatura fornecida não corresponde à esperada',
          receivedSignature: signature
        },
        { status: 401 }
      );
    }
    
    // Converter o payload para JSON
    const event = JSON.parse(payload) as WebhookEvent;
    
    // Log do evento recebido (opcional, pode ser removido em produção)
    console.log(`[${event.timestamp || Date.now()}] Evento recebido (${event.event}):`, 
      JSON.stringify(event, null, 2));
    
    // Processar o evento com base no tipo
    switch (event.event) {
      case 'connection.update':
        await handleConnectionEvent(event);
        break;
        
      case 'messages.upsert':
        await handleMessageEvent(event);
        break;
        
      case 'messages.update':
        console.log(`[${event.instance}] Mensagem atualizada:`, event.data);
        break;
        
      case 'presence.update':
        console.log(`[${event.instance}] Atualização de presença:`, event.data);
        break;
        
      case 'groups.upsert':
        console.log(`[${event.instance}] Grupo criado/atualizado:`, event.data);
        break;
        
      case 'groups.update':
        console.log(`[${event.instance}] Grupo atualizado:`, event.data);
        break;
        
      case 'groups.participants.update':
        console.log(`[${event.instance}] Participantes do grupo atualizados:`, event.data);
        break;
        
      default:
        console.log(`[${event.instance}] Evento não tratado (${event.event}):`, event.data);
        break;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Adicionando suporte ao método OPTIONS para validação do webhook
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-hub-signature-256',
    },
  });
}
