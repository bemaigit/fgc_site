import { NextRequest, NextResponse } from 'next/server';
import { minioClient } from '@/lib/minio';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const path = searchParams.get('path');
    
    if (!path) {
      console.error('[User Image Proxy] Parâmetro path não fornecido');
      return new NextResponse('Parâmetro path é obrigatório', { status: 400 });
    }
    
    console.log(`[User Image Proxy] Caminho original recebido: "${path}"`);
    
    // Validar se o caminho parece ser uma imagem
    const isValidImagePath = /\.(jpe?g|png|webp|gif|svg)$/i.test(path);
    if (!isValidImagePath) {
      console.error(`[User Image Proxy] Caminho não parece ser uma imagem válida: ${path}`);
      return new NextResponse('Caminho não parece ser uma imagem', { status: 400 });
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
    
    // Para imagens de perfil, tentar diferentes prefixos comuns
    if (!processedPath.startsWith('profile/') && !processedPath.startsWith('usuarios/')) {
      // Verificar se contém um nome de arquivo no final
      const filename = processedPath.split('/').pop() || processedPath;
      
      // Adicionar caminhos com diferentes prefixos
      pathsToTry.push(`profile/${filename}`);
      pathsToTry.push(`usuarios/${filename}`);
      pathsToTry.push(`perfil/${filename}`);
      pathsToTry.push(`perfil atleta/${filename}`);
      
      // Adicionar path direto sem prefixo (para casos onde o arquivo está na raiz)
      if (processedPath.includes('/')) {
        pathsToTry.push(filename);
      }
    }
    
    console.log(`[User Image Proxy] Caminhos a tentar:`, pathsToTry);
    
    // Determinar tipo de conteúdo com base na extensão
    let contentType = 'image/jpeg'; // Padrão
    if (processedPath.endsWith('.png')) {
      contentType = 'image/png';
    } else if (processedPath.endsWith('.webp')) {
      contentType = 'image/webp';
    } else if (processedPath.endsWith('.svg')) {
      contentType = 'image/svg+xml';
    } else if (processedPath.endsWith('.gif')) {
      contentType = 'image/gif';
    }
    
    // Variáveis para armazenar o resultado da tentativa bem-sucedida
    let fileBuffer: Buffer | null = null;
    let successPath: string | null = null;
    
    // Tentar cada caminho alternativo
    for (const testPath of pathsToTry) {
      try {
        console.log(`[User Image Proxy] Tentando buscar: bucket="${process.env.MINIO_BUCKET}", objeto="${testPath}"`);
        
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
        
        console.log(`[User Image Proxy] Imagem carregada com sucesso: ${testPath}, tamanho: ${fileBuffer.length} bytes`);
        break; // Sair do loop se encontrou o arquivo
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(`[User Image Proxy] Falha ao buscar "${testPath}": ${errorMsg}`);
        // Continua para tentar o próximo caminho
      }
    }
    
    // Se encontrou uma versão do arquivo, retorna-o
    if (fileBuffer && successPath) {
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
    
    // Se chegou aqui, nenhuma das tentativas funcionou
    console.error(`[User Image Proxy] Não foi possível encontrar o arquivo em nenhum dos caminhos testados`);
    return new NextResponse('Erro ao carregar imagem, arquivo não encontrado', { status: 404 });
  } catch (error) {
    console.error('[User Image Proxy] Erro interno:', error);
    return new NextResponse('Erro interno do servidor', { status: 500 });
  }
}
