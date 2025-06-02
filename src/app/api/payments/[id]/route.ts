// API route para obter detalhes de um pagamento específico por ID
// /api/payments/[id]/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Aguardar os parâmetros conforme recomendação do Next.js
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  if (!id) {
    return NextResponse.json(
      { error: 'ID do pagamento é obrigatório' },
      { status: 400 }
    )
  }
  
  try {
    // Buscar a transação no banco de dados
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id }
    })
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      )
    }
    
    // Extrair dados do QR code do campo metadata
    let qrCode = '';
    let qrCodeBase64 = '';
    let metadata = {} as any;
    
    // Se tiver dados de PIX armazenados, extraímos do metadata
    if (transaction.metadata && typeof transaction.metadata === 'object') {
      metadata = transaction.metadata as any
      
      if (metadata.qrCode) {
        qrCode = metadata.qrCode;
      }
      
      if (metadata.qrCodeBase64) {
        // Se tiver o prefixo data:image já incluído, usa como está
        qrCodeBase64 = metadata.qrCodeBase64.startsWith('data:image') 
          ? metadata.qrCodeBase64
          : `data:image/png;base64,${metadata.qrCodeBase64}`;
      }
    }
    
    // Formatar a resposta com abordagem híbrida
    return NextResponse.json({
      id: transaction.id,
      protocol: transaction.protocol,
      status: transaction.status,
      amount: parseFloat(transaction.amount.toString()),
      paymentMethod: transaction.paymentMethod,
      paymentUrl: transaction.paymentUrl || null,
      // Priorizar dados reais do PIX se disponíveis no metadata, com fallback para o ID externo
      qrCode: qrCode || metadata.pixCode || transaction.externalId || null,
      // Priorizar a imagem do gateway, com fallback para null (frontend usará API externa)
      qrCodeBase64: qrCodeBase64 || null,
      paidAt: transaction.paidAt,
      expiresAt: transaction.expiresAt,
      createdAt: transaction.createdAt
    })
    
  } catch (error) {
    console.error('Erro ao obter detalhes do pagamento:', error)
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    )
  }
}
