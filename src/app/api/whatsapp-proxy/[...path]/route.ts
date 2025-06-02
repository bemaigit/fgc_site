import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

/**
 * API Proxy para encaminhar requisições para a API Meow do WhatsApp
 * Permite usar um único túnel ngrok e ainda acessar a API Meow
 * 
 * Exemplo de uso:
 * /api/whatsapp-proxy/manager/instance/fetchInstances -> http://localhost:8080/manager/instance/fetchInstances
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // No Next.js App Router, params é uma Promise que precisa ser aguardada
    const path = await Promise.resolve(params.path);
    
    // Obtém a URL da API Meow das variáveis de ambiente
    const apiUrl = process.env.WHATSAPP_API_URL || 'http://localhost:8080';
    
    // Constrói o caminho completo para o endpoint da API Meow
    const pathString = path.join('/');
    const fullUrl = `${apiUrl}/${pathString}`;
    
    console.log(`[Proxy WhatsApp] Encaminhando GET para: ${fullUrl}`);
    console.log(`[Proxy WhatsApp] Verificando se API está acessível em: ${apiUrl}`);
    
    // Adiciona timeout para evitar esperar muito tempo
    const response = await axios.get(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.WHATSAPP_WEBHOOK_SECRET || 'meow_webhook_secret'
      },
      timeout: 5000 // 5 segundos de timeout
    });
    
    console.log(`[Proxy WhatsApp] Resposta recebida com status: ${response.status}`);
    
    // Retorna a resposta da API Meow
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(`[Proxy WhatsApp] Erro ao encaminhar requisição:`, error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('[Proxy WhatsApp] Não foi possível conectar à API Meow. Verifique se ela está rodando.');
      return NextResponse.json(
        { 
          error: 'Não foi possível conectar à API Meow',
          message: 'Verifique se a API está rodando em http://localhost:8080',
          status: 503
        }, 
        { status: 503 }
      );
    }
    
    // Retorna o erro original da API Meow
    return NextResponse.json(
      { 
        error: 'Erro ao encaminhar requisição para API WhatsApp',
        message: error.message,
        status: error.response?.status || 500
      }, 
      { status: error.response?.status || 500 }
    );
  }
}

/**
 * Método POST para o proxy
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // No Next.js App Router, params é uma Promise que precisa ser aguardada
    const path = await Promise.resolve(params.path);
    
    // Obtém a URL da API Meow das variáveis de ambiente
    const apiUrl = process.env.WHATSAPP_API_URL || 'http://localhost:8080';
    
    // Constrói o caminho completo para o endpoint da API Meow
    const pathString = path.join('/');
    const fullUrl = `${apiUrl}/${pathString}`;
    
    // Obtém o corpo da requisição
    const body = await req.json();
    
    console.log(`[Proxy WhatsApp] Encaminhando POST para: ${fullUrl}`);
    
    // Encaminha a requisição para a API Meow
    const response = await axios.post(fullUrl, body, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.WHATSAPP_WEBHOOK_SECRET || 'meow_webhook_secret'
      },
      timeout: 5000 // 5 segundos de timeout
    });
    
    console.log(`[Proxy WhatsApp] Resposta recebida com status: ${response.status}`);
    
    // Retorna a resposta da API Meow
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(`[Proxy WhatsApp] Erro ao encaminhar requisição:`, error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('[Proxy WhatsApp] Não foi possível conectar à API Meow. Verifique se ela está rodando.');
      return NextResponse.json(
        { 
          error: 'Não foi possível conectar à API Meow',
          message: 'Verifique se a API está rodando em http://localhost:8080',
          status: 503
        }, 
        { status: 503 }
      );
    }
    
    // Retorna o erro original da API Meow
    return NextResponse.json(
      { 
        error: 'Erro ao encaminhar requisição para API WhatsApp',
        message: error.message,
        status: error.response?.status || 500
      }, 
      { status: error.response?.status || 500 }
    );
  }
}
