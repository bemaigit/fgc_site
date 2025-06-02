import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { evolutionService } from '@/lib/whatsapp/evolution-service';

export async function POST(request: NextRequest) {
  try {
    // Tentativa 1: Testar a conexão direta com a API
    const apiUrl = process.env.WHATSAPP_API_URL || 'http://localhost:8080';
    const apiKey = process.env.WHATSAPP_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
    
    console.log('API WhatsApp - Teste de conexão:', { apiUrl, apiKey: apiKey.substring(0, 4) + '...' });
    
    // Fazer uma requisição direta à API da Evolution
    let rawApiResponse;
    try {
      rawApiResponse = await axios.get(`${apiUrl}/instance/list`, {
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 5000
      });
    } catch (err: any) {
      rawApiResponse = {
        error: true,
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data
        } : 'No response data'
      };
    }
    
    // Tentativa 2: Usar nosso serviço para listar instâncias
    let serviceResponse;
    try {
      serviceResponse = await evolutionService.listInstances();
    } catch (err: any) {
      serviceResponse = {
        error: true,
        message: err.message,
        details: err.details
      };
    }
    
    // Também buscar o endpoint exato que usamos no cliente
    let serviceGetResponse;
    try {
      serviceGetResponse = await axios.get(`${apiUrl}/instance/list`, {
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json',
        }
      });
    } catch (err: any) {
      serviceGetResponse = {
        error: true,
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data
        } : 'No response data'
      };
    }
    
    // Tentar também o endpoint alternativo
    let alternativeResponse;
    try {
      alternativeResponse = await axios.get(`${apiUrl}/instance/fetchInstances`, {
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json',
        }
      });
    } catch (err: any) {
      alternativeResponse = {
        error: true,
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data
        } : 'No response data'
      };
    }
    
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      environment: {
        apiUrl,
        apiKeyPrefix: apiKey.substring(0, 4) + '...',
      },
      directApiResponse: {
        status: rawApiResponse.status || 'error',
        data: rawApiResponse.data || rawApiResponse
      },
      serviceResponse,
      serviceGetResponse: {
        status: serviceGetResponse.status || 'error',
        data: serviceGetResponse.data || serviceGetResponse
      },
      alternativeResponse: {
        status: alternativeResponse.status || 'error',
        data: alternativeResponse.data || alternativeResponse
      }
    });
    
  } catch (error: any) {
    console.error('API WhatsApp - Erro no teste de conexão:', error);
    
    return NextResponse.json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
