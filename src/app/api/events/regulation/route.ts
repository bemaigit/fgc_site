import { NextRequest, NextResponse } from 'next/server';
import { minioClient } from '@/lib/minio';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const path = searchParams.get('path');
    
    if (!path) {
      console.error('[Events Regulation Proxy] Parâmetro path não fornecido');
      return new NextResponse('Parâmetro path é obrigatório', { status: 400 });
    }
    
    console.log(`[Events Regulation Proxy] Caminho original recebido: "${path}"`);
    
    // Validar se o caminho parece ser um documento
    const isValidDocPath = /\.(pdf|doc|docx|txt)$/i.test(path);
    if (!isValidDocPath) {
      console.error(`[Events Regulation Proxy] Caminho não parece ser um documento válido: ${path}`);
      return new NextResponse('Caminho não parece ser um documento', { status: 400 });
    }
    
    // Preparar os caminhos alternativos para tentar (original e com/sem modificações)
    const pathsToTry: string[] = [];
    
    // Processar o caminho para garantir compatibilidade com diferentes formatos
    let processedPath = path;
    
    // Caso 1: Se for uma URL completa, extrair apenas o caminho
    if (path.includes('://')) {
      try {
        const urlObj = new URL(path);
        processedPath = urlObj.pathname.replace(/^\/storage\//, '').replace(/^\/fgc\//, '');
      } catch (error) {
        console.error('Erro ao processar URL completa:', error);
      }
    } 
    // Caso 2: Se começar com /storage/, remover esse prefixo
    else if (path.startsWith('/storage/')) {
      processedPath = path.substring(9); // Remove '/storage/'
    }
    // Caso 3: Se começar com /fgc/, remover esse prefixo
    else if (path.startsWith('/fgc/')) {
      processedPath = path.substring(5); // Remove '/fgc/'
    }
    // Caso 4: Se começar com storage/, remover esse prefixo
    else if (path.startsWith('storage/')) {
      processedPath = path.substring(8); // Remove 'storage/'
    }
    // Caso 5: Se começar com fgc/, remover esse prefixo
    else if (path.startsWith('fgc/')) {
      processedPath = path.substring(4); // Remove 'fgc/'
    }
    
    // Adicionar caminho processado à lista de tentativas
    pathsToTry.push(processedPath);
    
    // Se o caminho processado tem espaços, adicionar alternativa com hífens
    if (processedPath.includes(' ')) {
      pathsToTry.push(processedPath.replace(/\s+/g, '-'));
    }
    
    // Se o caminho processado tem hífens, adicionar alternativa com espaços
    if (processedPath.includes('-')) {
      pathsToTry.push(processedPath.replace(/-+/g, ' '));
    }
    
    // Para casos onde o caminho pode estar em diretórios diferentes
    if (!processedPath.startsWith('regulations/') && !processedPath.startsWith('eventos/')) {
      // Adicionar versão com prefixos comuns
      const filename = processedPath.split('/').pop() || processedPath;
      pathsToTry.push(`regulations/${filename}`);
      pathsToTry.push(`eventos/regulamentos/${filename}`);
    }
    
    console.log(`[Events Regulation Proxy] Caminhos a tentar:`, pathsToTry);
    
    // Determinar tipo de conteúdo com base na extensão
    let contentType = 'application/pdf'; // Padrão
    if (processedPath.endsWith('.doc')) {
      contentType = 'application/msword';
    } else if (processedPath.endsWith('.docx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (processedPath.endsWith('.txt')) {
      contentType = 'text/plain';
    }
    
    // Variáveis para armazenar o resultado da tentativa bem-sucedida
    let fileBuffer: Buffer | null = null;
    let successPath: string | null = null;
    
    // Tentar cada caminho alternativo
    for (const testPath of pathsToTry) {
      try {
        console.log(`[Events Regulation Proxy] Tentando buscar: bucket="${process.env.MINIO_BUCKET}", objeto="${testPath}"`);
        
        // Usar a versão de stream do método getObject
        const fileStream = await minioClient.getObject(
          process.env.MINIO_BUCKET!,
          testPath
        );
        
        // Coletar os chunks de dados em um array de buffers
        const chunks: Buffer[] = [];
        
        // Processar a stream de dados
        for await (const chunk of fileStream) {
          chunks.push(chunk);
        }
        
        // Combinar todos os chunks em um único buffer
        fileBuffer = Buffer.concat(chunks);
        successPath = testPath;
        
        console.log(`[Events Regulation Proxy] Documento carregado com sucesso: ${testPath}, tamanho: ${fileBuffer.length} bytes`);
        break; // Sair do loop se encontrou o arquivo
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(`[Events Regulation Proxy] Falha ao buscar "${testPath}": ${errorMsg}`);
        // Continua para tentar o próximo caminho
      }
    }
    
    // Se encontrou uma versão do arquivo, retorna-o
    if (fileBuffer && successPath) {
      // Extrair o nome do arquivo do caminho
      const fileName = successPath.split('/').pop() || 'regulamento.pdf';
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${fileName}"`,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
    
    // Se chegou aqui, nenhuma das tentativas funcionou
    console.error(`[Events Regulation Proxy] Não foi possível encontrar o arquivo em nenhum dos caminhos testados`);
    return new NextResponse('Erro ao carregar documento, arquivo não encontrado', { status: 404 });
  } catch (error) {
    console.error('[Events Regulation Proxy] Erro interno:', error);
    return new NextResponse('Erro interno do servidor', { status: 500 });
  }
}
