import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/storage';

export const runtime = 'nodejs';

/**
 * API de proxy para imagens do banner do calendário
 * Acessa o MinIO e retorna a imagem como um stream, aplicando headers adequados
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[Calendar Banner Image] Requisição recebida');
    
    const { searchParams } = req.nextUrl;
    const path = searchParams.get('path');
    
    // Caminho padrão para fallback
    let targetPath = 'banners/calendario/banner-principal.jpg';
    
    // Se um caminho específico foi fornecido, usá-lo
    if (path) {
      targetPath = path;
      
      // Verificar se já tem o prefixo correto
      if (!path.startsWith('banners/') && !path.startsWith('calendario/')) {
        targetPath = `banners/calendario/${path}`;
      }
    }
    
    console.log(`[Calendar Banner Image] Buscando arquivo: ${targetPath}`);
    
    try {
      // Configurar o serviço de storage
      storageService.setPrefix('');
      
      // Buscar o stream do arquivo
      const fileStream = await storageService.getFileStream(targetPath);
      
      if (!fileStream) {
        throw new Error(`Arquivo não encontrado: ${targetPath}`);
      }
      
      // Converter o stream para buffer
      const chunks: Buffer[] = [];
      for await (const chunk of fileStream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      
      const buffer = Buffer.concat(chunks);
      
      // Determinar o tipo de conteúdo baseado na extensão
      let contentType = 'image/jpeg'; // Padrão
      if (targetPath.endsWith('.png')) contentType = 'image/png';
      if (targetPath.endsWith('.webp')) contentType = 'image/webp';
      if (targetPath.endsWith('.svg')) contentType = 'image/svg+xml';
      if (targetPath.endsWith('.gif')) contentType = 'image/gif';
      
      // Configurar headers
      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Content-Length', buffer.length.toString());
      headers.set('Cache-Control', 'public, max-age=300'); // 5 minutos
      
      console.log('[Calendar Banner Image] Imagem encontrada e retornada');
      
      return new NextResponse(buffer, {
        status: 200,
        headers
      });
    } catch (error) {
      console.error('[Calendar Banner Image] Erro:', error);
      
      // Redirecionar para a imagem padrão
      console.log('[Calendar Banner Image] Redirecionando para imagem padrão');
      return NextResponse.redirect(new URL('/images/calendar-banner-placeholder.jpg', req.nextUrl.origin));
    }
  } catch (generalError) {
    console.error('[Calendar Banner Image] Erro geral:', generalError);
    return new NextResponse('Erro ao processar imagem', { status: 500 });
  }
}
