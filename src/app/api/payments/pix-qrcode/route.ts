import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { prisma } from '@/lib/prisma';

// Endpoint para redirecionar ao QR code PIX ou gerar uma URL para Google Charts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID do pagamento não informado' }, { status: 400 });
    }
    
    // Buscar a transação no banco
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id }
    });
    
    if (!transaction) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
    }
    
    // Verificar se é um pagamento PIX
    if (transaction.paymentMethod !== 'PIX') {
      return NextResponse.json({ error: 'Método de pagamento não é PIX' }, { status: 400 });
    }

    // Extrair o código PIX ou ID da preferência dos metadados
    const pixCode = transaction.metadata?.['pixCode'] || 
                   transaction.metadata?.['preferenceId'];
    
    if (!pixCode) {
      return NextResponse.json({ error: 'Código PIX não encontrado' }, { status: 404 });
    }
    
    // Usar Google Charts API para gerar QR code
    const googleChartsUrl = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(pixCode)}&chld=H|1`;
    
    // Redirecionar para a URL do Google Charts
    return NextResponse.redirect(googleChartsUrl);
  } catch (error: any) {
    console.error('Erro ao processar QR code PIX:', error);
    return NextResponse.json({ 
      error: 'Falha ao processar QR code', 
      details: error.message 
    }, { status: 500 });
  }
}
