import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { processDocumentUrl } from '@/lib/processDocumentUrl';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraímos o ID diretamente da desestruturação - esta é a forma recomendada
    const { id } = params;
    
    // Verifica autenticação
    const session = await getServerSession(authOptions);
    console.log('[JWT Callback] User:', session?.user);

    // Verificar se o documento existe
    const document = await prisma.document.findUnique({
      where: { 
        id,
        active: true
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      );
    }

    // Se o documento não estiver ativo, apenas usuários autenticados podem baixá-lo
    if (!document.active && !session?.user) {
      return NextResponse.json(
        { error: 'Acesso negado a este documento' },
        { status: 403 }
      );
    }

    console.log('Processando download:', {
      fileUrl: document.fileUrl,
      fileName: document.fileName,
      mimeType: document.mimeType
    });

    try {
      // Usa o proxy para servir o documento
      const downloadUrl = processDocumentUrl(document.fileUrl);
      
      // Garantir que a URL é absoluta caso o proxy retorne um caminho relativo
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      const absoluteUrl = downloadUrl.startsWith('http') 
        ? downloadUrl
        : `${baseUrl}${downloadUrl}`;

      console.log('URL de download gerada:', {
        originalUrl: document.fileUrl,
        downloadUrl: absoluteUrl
      });

      // Atualiza o contador de downloads
      await prisma.document.update({
        where: { id },
        data: { downloads: { increment: 1 } }
      });

      return NextResponse.json({ url: absoluteUrl });
    } catch (storageError) {
      console.error('Erro ao gerar URL de download:', storageError);
      return NextResponse.json(
        { error: 'Erro ao gerar URL de download' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao processar download:', error);
    return NextResponse.json(
      { error: 'Erro ao processar download' },
      { status: 500 }
    );
  }
}
