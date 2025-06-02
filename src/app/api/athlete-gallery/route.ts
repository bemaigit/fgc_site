import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { processAthleteGalleryUrl } from '@/lib/processAthleteGalleryUrl'
import { randomUUID } from 'crypto' // Para gerar UUIDs

// GET /api/athlete-gallery?athleteId=123 ou /api/athlete-gallery?userId=456
// Retorna a galeria de um atleta específico
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const athleteId = searchParams.get('athleteId')
    const userId = searchParams.get('userId')
    
    console.log('Parâmetros de busca:', { athleteId, userId })
    
    // Se tivermos um userId, tentamos encontrar o atleta pelo userId primeiro
    if (userId) {
      console.log('Buscando atleta pelo userId:', userId)
      
      // Buscar o atleta pelo userId
      const athlete = await prisma.athlete.findFirst({
        where: { userId },
        select: { id: true }
      })
      
      if (athlete) {
        console.log('Atleta encontrado pelo userId:', athlete.id)
        // Continuar o fluxo usando o ID real do atleta
        return await getGalleryByAthleteId(athlete.id)
      } else {
        console.log('Nenhum atleta encontrado para o userId:', userId)
        return NextResponse.json([])
      }
    }
    
    // Fluxo normal usando athleteId
    if (!athleteId) {
      return NextResponse.json({ error: 'ID do atleta não fornecido' }, { status: 400 })
    }
    
        return getGalleryByAthleteId(athleteId);
  } catch (error) {
    console.error('Erro ao buscar galeria do atleta:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar galeria do atleta' },
      { status: 500 }
    )
  }
}

// Função auxiliar para buscar e processar a galeria de um atleta por ID
async function getGalleryByAthleteId(athleteId: string) {
  try {
    // Se for um ID temporário, podemos tentar extrair um userId dele
    if (athleteId.startsWith('temp_')) {
      const potentialUserId = athleteId.replace('temp_', '');
      console.log('ID temporário detectado, tentando encontrar atleta pelo userId extraído:', potentialUserId);
      
      // Tentar buscar o atleta pelo userId extraído do ID temporário
      const athlete = await prisma.athlete.findFirst({
        where: { userId: potentialUserId },
        select: { id: true }
      });
      
      if (athlete) {
        console.log('Atleta encontrado pelo userId extraído:', athlete.id);
        // Usar o ID real do atleta
        athleteId = athlete.id;
      } else {
        console.log('Nenhum atleta encontrado para o userId extraído, retornando galeria vazia');
        return NextResponse.json([]);
      }
    }
    
    // Buscar imagens com o ID do atleta
    console.log('Buscando galeria para o athleteId:', athleteId);
    let gallery = await prisma.athleteGallery.findMany({
      where: { athleteId },
      orderBy: [
        { featured: 'desc' },
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    
    // Caso especial: verificar se o athleteId é na verdade um userId
    if (gallery.length === 0) {
      console.log(`Nenhuma imagem encontrada. Verificando se ${athleteId} é um userId...`);
      
      // Tentar buscar o atleta pelo userId
      const athlete = await prisma.athlete.findFirst({
        where: { userId: athleteId },
        select: { id: true }
      });
      
      if (athlete) {
        console.log(`Atleta encontrado pelo userId! ID real do atleta: ${athlete.id}`);
        
        // Buscar novamente com o ID real do atleta
        gallery = await prisma.athleteGallery.findMany({
          where: { athleteId: athlete.id },
          orderBy: [
            { featured: 'desc' },
            { order: 'asc' },
            { createdAt: 'desc' }
          ]
        });
        
        console.log(`Encontradas ${gallery.length} imagens na galeria do atleta ${athlete.id} (buscado via userId ${athleteId})`);
      }
    }
    
    // Se ainda não encontrou imagens, retorna array vazio
    if (gallery.length === 0) {
      console.log('Nenhuma imagem encontrada na galeria do atleta');
      return NextResponse.json([]);
    }
    
    console.log(`Encontradas ${gallery.length} imagens na galeria do atleta ${athleteId}`);
    
    // Processar as imagens para garantir que as URLs estejam corretas
    const processedGallery = gallery.map(image => {
      try {
        // O imageUrl já deve conter apenas o nome do arquivo, mas vamos garantir
        let fileName = image.imageUrl;
        
        // Se for uma URL completa, extrai apenas o nome do arquivo
        if (fileName.includes('/')) {
          const urlParts = fileName.split('/');
          fileName = urlParts[urlParts.length - 1];
        }
        
        // Remove qualquer parâmetro de consulta
        fileName = fileName.split('?')[0];
        
        // Remove caracteres inválidos do nome do arquivo, mas mantém o formato original
        const cleanFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '');
        
        // Garante que o nome do arquivo comece com 'athlete-'
        const finalFileName = cleanFileName.startsWith('athlete-') 
          ? cleanFileName 
          : `athlete-${cleanFileName}`;
        
        // Constrói a URL correta para o proxy
        // Usando o caminho completo para garantir compatibilidade
        const imageUrl = `/api/athlete-gallery/image?path=athlete-gallery/${encodeURIComponent(finalFileName)}`;
        
        // URL alternativa direta para o MinIO (para fallback)
        const directUrl = `${process.env.NEXT_PUBLIC_MINIO_URL || 'https://minio.fgc.foxconn.com.br'}/fgc/athlete-gallery/${encodeURIComponent(finalFileName)}`;
        
        console.log('Processando imagem da galeria:', {
          id: image.id,
          originalUrl: image.imageUrl,
          cleanFileName: finalFileName,
          imageUrl,
          directUrl,
          timestamp: new Date().toISOString()
        });
        
        return {
          ...image,
          // Usa a URL do proxy para exibição
          imageUrl: imageUrl,
          // Mantém o nome do arquivo limpo para referência
          imageUrlClean: finalFileName,
          // Adiciona URL direta para fallback
          directUrl: directUrl
        };  
      } catch (error) {
        console.error('Erro ao processar imagem da galeria:', error, image);
        // Em caso de erro, retorna a imagem sem alterações
        return image;
      }
    });
    
    if (processedGallery.length > 0) {
      console.log('Primeira imagem processada:', { 
        id: processedGallery[0].id,
        url: processedGallery[0].imageUrl?.substring(0, 50) + '...',
        directUrl: processedGallery[0].directUrl?.substring(0, 30) + '...',
        featured: processedGallery[0].featured,
      });
    }
    
    return NextResponse.json(processedGallery)
  } catch (error) {
    console.error('Erro ao buscar galeria do atleta:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar galeria do atleta' },
      { status: 500 }
    )
  }
}

// POST /api/athlete-gallery
// Adiciona uma nova imagem à galeria do atleta
export async function POST(request: NextRequest) {
  try {
    console.log('Iniciando POST /api/athlete-gallery')
    
    const session = await getServerSession(authOptions)
    
    // Verifica autenticação
    if (!session) {
      console.log('Autenticação falhou - usuário não logado')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    console.log('Usuário autenticado:', session.user.id)
    
    const data = await request.json()
    const { athleteId, imageUrl, title, description, featured } = data
    
    console.log('Dados recebidos:', { athleteId, imageUrl: imageUrl?.substring(0, 50) + '...', title, description, featured })
    
    // Verificar se o athleteId existe no banco de dados
    let athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      select: { id: true, userId: true }
    })
    
    // Se não encontrar pelo ID, talvez o athleteId seja na verdade o userId
    // Este é um caso comum quando o frontend envia session.user.id em vez do ID real do atleta
    if (!athlete) {
      console.log(`Atleta não encontrado pelo ID. Tentando buscar pelo userId ${athleteId}`)
      
      athlete = await prisma.athlete.findFirst({
        where: { userId: athleteId },
        select: { id: true, userId: true }
      })
      
      if (athlete) {
        console.log(`Atleta encontrado pelo userId: ${JSON.stringify(athlete)}`)
      }
    }
    
    console.log('Atleta encontrado:', athlete)
    
    if (!athlete) {
      console.log(`Erro: Atleta com ID/userId ${athleteId} não encontrado no banco de dados`)
      return NextResponse.json({ error: 'Atleta não encontrado' }, { status: 404 })
    }
    
    // Verifica permissões: ou é o próprio atleta (via userId) ou é um admin
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
    const isOwner = session.user.id === athlete.userId // Compara com userId, não athleteId
    
    console.log('Verificação de permissões:', { 
      isAdmin, 
      isOwner, 
      sessionUserId: session.user.id, 
      athleteUserId: athlete.userId 
    })
    
    if (!isAdmin && !isOwner) {
      console.log('Acesso negado: nem admin nem proprietário')
      return NextResponse.json({ error: 'Sem permissão para esta operação' }, { status: 403 })
    }
    
    console.log('Permissão concedida para adicionar imagem')
    
    // Usamos o athlete.id (ID real do atleta) em vez do athleteId original
    // que poderia ser o userId
    const realAthleteId = athlete.id;
    console.log(`Usando ID real do atleta: ${realAthleteId} (em vez de ${athleteId})`)
    
    // Obtém a maior ordem atual para inserir no final
    const maxOrderImage = await prisma.athleteGallery.findFirst({
      where: { athleteId: realAthleteId },
      orderBy: { order: 'desc' }
    })
    
    const newOrder = maxOrderImage ? maxOrderImage.order + 1 : 0
    
    // Caso seja uma imagem destacada, remove a marcação de destaque de outras imagens
    if (featured) {
      await prisma.athleteGallery.updateMany({
        where: { 
          athleteId: realAthleteId,
          featured: true
        },
        data: { 
          featured: false 
        }
      })
    }
    
    // Verifica se a URL é válida
    if (!imageUrl) {
      console.error('URL da imagem não fornecida');
      return NextResponse.json(
        { error: 'URL da imagem é obrigatória' },
        { status: 400 }
      );
    }
    
    console.log('Processando URL da imagem:', imageUrl);
    
    // Extrai o nome do arquivo da URL
    let fileName = '';
    
    try {
      console.log('Processando URL da imagem:', imageUrl);
      
      // Decodifica a URL
      const decodedUrl = decodeURIComponent(imageUrl);
      console.log('URL decodificada:', decodedUrl);
      
      // Verifica se a URL é de uma imagem de perfil (não deve ser permitido na galeria)
      if (decodedUrl.includes('/profile/') || decodedUrl.includes('path=profile/')) {
        throw new Error('Não é permitido usar imagens de perfil na galeria de atletas');
      }
      
      // Tenta extrair o parâmetro 'path' se for uma URL de proxy
      if (decodedUrl.includes('path=')) {
        try {
          // Se for uma URL completa, usa o objeto URL
          if (decodedUrl.startsWith('http')) {
            const urlObj = new URL(decodedUrl);
            const pathParam = urlObj.searchParams.get('path');
            if (pathParam) {
              // Verifica se é uma imagem da galeria de atletas
              if (!pathParam.startsWith('athlete-gallery/')) {
                throw new Error('Apenas imagens da galeria de atletas são permitidas');
              }
              // Remove o prefixo 'athlete-gallery/'
              fileName = pathParam.replace(/^athlete-gallery\//, '');
              console.log('Extraído de URL de proxy (completa):', { pathParam, fileName });
            }
          } 
          // Se for um caminho relativo, extrai manualmente o parâmetro
          else {
            const match = decodedUrl.match(/[?&]path=([^&]+)/);
            if (match && match[1]) {
              const pathParam = decodeURIComponent(match[1]);
              // Verifica se é uma imagem da galeria de atletas
              if (!pathParam.startsWith('athlete-gallery/')) {
                throw new Error('Apenas imagens da galeria de atletas são permitidas');
              }
              // Remove o prefixo 'athlete-gallery/'
              fileName = pathParam.replace(/^athlete-gallery\//, '');
              console.log('Extraído de URL de proxy (relativa):', { pathParam, fileName });
            }
          }
        } catch (error) {
          console.error('Erro ao processar URL de proxy:', error);
          throw error; // Propaga o erro para ser tratado externamente
        }
      }
      
      // Se ainda não encontrou o nome do arquivo, tenta extrair de outros formatos
      if (!fileName) {
        // Se for uma URL completa, extrai o nome do arquivo
        if (decodedUrl.startsWith('http')) {
          try {
            const urlObj = new URL(decodedUrl);
            const pathParts = urlObj.pathname.split('/');
            fileName = pathParts[pathParts.length - 1];
            console.log('Extraído de URL completa:', { pathname: urlObj.pathname, fileName });
          } catch (error) {
            console.error('Erro ao processar URL completa:', error);
            throw new Error('Formato de URL inválido');
          }
        } 
        // Se for um caminho relativo, extrai o nome do arquivo
        else {
          const pathParts = decodedUrl.split('/');
          fileName = pathParts[pathParts.length - 1];
          console.log('Extraído de caminho relativo:', { decodedUrl, fileName });
        }
      }
      
      // Remove qualquer parâmetro de consulta que possa ter sobrado
      const cleanFileName = fileName.split('?')[0];
      
      // Verifica se o nome do arquivo é válido e começa com o prefixo 'athlete-'
      if (!cleanFileName || !/\.[a-zA-Z0-9]+$/.test(cleanFileName)) {
        throw new Error(`Nome de arquivo inválido: ${cleanFileName}`);
      }
      
      // Verifica se o nome do arquivo começa com o prefixo 'athlete-'
      if (!cleanFileName.startsWith('athlete-')) {
        throw new Error('Apenas imagens da galeria de atletas são permitidas');
      }
      
      console.log('Nome do arquivo processado:', { 
        original: imageUrl, 
        clean: cleanFileName,
        length: cleanFileName.length 
      });
      
      // Garante que o nome do arquivo não contenha caracteres inválidos
      fileName = cleanFileName.replace(/[\\/:*?"<>|]/g, '');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao processar a URL da imagem:', errorMessage);
      return NextResponse.json(
        { error: `Formato de URL de imagem inválido: ${errorMessage}` },
        { status: 400 }
      );
    }
    
    // Garante que o nome do arquivo esteja limpo
    const cleanFileName = fileName.trim();
    
    console.log('Dados da imagem para salvar no banco de dados:', {
      originalUrl: imageUrl?.substring(0, 50) + (imageUrl?.length > 50 ? '...' : ''),
      cleanFileName: cleanFileName,
      originalFileName: fileName,
      athleteId: realAthleteId,
      title: title || 'Sem título',
      featured: featured || false,
      order: newOrder
    });
    
    // Verifica se o arquivo já existe na galeria do atleta
    const existingImage = await prisma.athleteGallery.findFirst({
      where: {
        athleteId: realAthleteId,
        imageUrl: cleanFileName
      }
    });
    
    if (existingImage) {
      console.log('Imagem já existe na galeria do atleta:', existingImage.id);
      return NextResponse.json(existingImage);
    }
    
    try {
      const newImage = await prisma.athleteGallery.create({
        data: {
          id: randomUUID(), // Gerar UUID para o id
          athleteId: realAthleteId, // Usando ID real do atleta
          imageUrl: cleanFileName, // Salvando APENAS o nome do arquivo
          title: title || null, // Garante que seja null se não fornecido
          description: description || null, // Garante que seja null se não fornecido
          featured: featured || false,
          order: newOrder,
          // O Prisma irá definir automaticamente o createdAt e updatedAt
          // devido ao @default(now()) no schema
          updatedAt: new Date() // Garantindo que está atualizado
        }
      })
      
      console.log('Imagem criada com sucesso:', { id: newImage.id })
      return NextResponse.json(newImage)
    } catch (error) {
      console.error('Erro ao criar imagem:', error)
      throw error // Re-lançar para ser capturado pelo try/catch externo
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao adicionar imagem à galeria:', errorMessage)
    return NextResponse.json(
      { error: `Erro ao adicionar imagem à galeria: ${errorMessage}` },
      { status: 500 }
    )
  }
}
