import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Função para processar URLs de imagens com tratamento melhorado
function processImageUrl(imageUrl: string): string {
  if (!imageUrl) return '';
  
  console.log('Processando URL de banner (original):', imageUrl);
  
  // Se a URL já estiver sendo servida pelo nosso proxy personalizado, manté-la como está
  if (imageUrl.includes('/api/filiacao/banner/image') && imageUrl.includes('path=')) {
    console.log('URL já está usando o proxy, mantendo como está');
    return imageUrl;
  }
  
  // Extrai apenas o caminho relativo do arquivo, independente da origem
  let path = '';
  
  try {
    // CASO 1: URL completa com protocolo (https://dev.bemai.com.br/storage/...)
    if (imageUrl.includes('://')) {
      const urlObj = new URL(imageUrl);
      
      // Extrair o caminho após /storage/ ou /fgc/
      path = urlObj.pathname
        .replace(/^\/storage\//, '') // Remove /storage/ no início
        .replace(/^\/fgc\//, '');    // Remove /fgc/ no início
      
      console.log('Caminho extraído de URL completa:', path);
    } 
    // CASO 2: Caminho relativo (já sem protocolo)
    else {
      // Remover prefixos conhecidos para padronizar
      path = imageUrl
        .replace(/^\/+/, '')        // Remove barras iniciais
        .replace(/^storage\//, '')  // Remove storage/
        .replace(/^fgc\//, '');    // Remove fgc/
      
      console.log('Caminho extraído de caminho relativo:', path);
    }
    
    // Verificar se o caminho tem o prefixo 'filiacao-banners/'
    if (!path.includes('filiacao-banners/')) {
      // Verificar se parece um caminho de banner de filiação
      const looksLikeBannerPath = path.match(/\d+-[a-z0-9]+\.(?:png|jpg|jpeg|webp|gif)/i);
      
      if (looksLikeBannerPath) {
        path = `filiacao-banners/${path}`;
        console.log('Adicionado prefixo filiacao-banners/ ao caminho:', path);
      }
    }
    
    // Codificar o caminho para manipular espaços e caracteres especiais
    const encodedPath = encodeURIComponent(path);
    
    // Gerar URL para o endpoint de proxy universal
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
      ? process.env.NEXT_PUBLIC_BASE_URL.replace(/[\[\]\(\)]/g, '').replace(/\/+$/, '')
      : '';
    
    // Usar o endpoint de proxy que implementamos
    const proxyUrl = `${baseUrl || ''}/api/filiacao/banner/image?path=${encodedPath}`;
    
    console.log('URL final processada:', proxyUrl);
    return proxyUrl;
  } catch (error) {
    console.error('Erro ao processar URL do banner:', error);
    
    // Mesmo em caso de erro, tentar usar o proxy com a URL original
    try {
      // Tentar converter para um caminho relativo simples para o proxy
      const simplePath = imageUrl
        .replace(/^https?:\/\/[^\/]+\//, '') // Remove protocolo + domínio
        .replace(/^storage\//, '')             // Remove storage/
        .replace(/^fgc\//, '');               // Remove fgc/
      
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
        ? process.env.NEXT_PUBLIC_BASE_URL.replace(/[\[\]\(\)]/g, '').replace(/\/+$/, '')
        : '';
      
      return `${baseUrl || ''}/api/filiacao/banner/image?path=${encodeURIComponent(simplePath)}`;
    } catch {
      // Fallback final: retornar URL original
      return imageUrl;
    }
  }
}

// GET - Listar banners de filiação
export async function GET(request: Request) {
  try {
    // Verificar se há um parâmetro de tipo (ATHLETE ou CLUB)
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    const where = type 
      ? { type: type as 'ATHLETE' | 'CLUB' }
      : {};
    
    const banners = await prisma.filiationBanner.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 1,
    });
    
    // Se não encontrar banners, retornar vazio
    if (banners.length === 0) {
      return NextResponse.json([]);
    }

    // Usar nosso novo endpoint proxy para processar as imagens
    const processedBanners = banners.map((banner: any) => {
      if (!banner.image && !banner.imageUrl) return banner;
      
      // Verificar qual campo usar (backward compatibility)
      const imageField = banner.imageUrl || banner.image;
      let path = imageField;
      
      // Determinar se é uma URL completa ou um caminho relativo
      const isCompleteUrl = path.includes('://');
      
      if (isCompleteUrl) {
        try {
          // Extrair o pathname da URL absoluta
          const urlObj = new URL(path);
          // Pegar somente o caminho (sem domínio, protocolo ou 'storage')
          path = urlObj.pathname;
          
          // Remover prefixo '/storage/' se existir
          path = path.replace(/^\/storage\//, '');
          
          console.log(`[Banner Filiação] Extraído pathname da URL: ${path}`);
        } catch (error) {
          console.error('[Banner Filiação] Erro ao processar URL completa:', error);
        }
      } else {
        // Se for caminho relativo, limpar qualquer prefixo 'storage/'
        path = path.replace(/^\/+/, '').replace(/^storage\//, '');
      }
      
      // Codificar para URL
      const encodedPath = encodeURIComponent(path);
      
      // Gerar URL para o proxy
      let imageUrl;
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_BASE_URL) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL.replace(/[\[\]\(\)]/g, '').replace(/\/+$/, '');
        imageUrl = `${baseUrl}/api/filiacao/banner/image?path=${encodedPath}`;
      } else {
        imageUrl = `/api/filiacao/banner/image?path=${encodedPath}`;
      }
      
      console.log(`[Banner Filiação] Processado: ${imageField} -> ${imageUrl}`);
      
      return {
        ...banner,
        imageUrl
      };
    });
    
    return NextResponse.json(processedBanners);
  } catch (error) {
    console.error('Erro ao listar banners de filiação:', error);
    return NextResponse.json(
      { error: 'Erro ao listar banners de filiação' },
      { status: 500 }
    );
  }
}

// POST - Criar ou atualizar banner de filiação
export async function POST(request: Request) {
  try {
    // Verificar autenticação e permissão
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.log('Tentativa de acesso não autorizado ao endpoint de banner');
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }
    
    // Verificar se é admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      console.log('Usuário sem permissão adequada (role):', session.user.role);
      return NextResponse.json(
        { error: "Permissão negada" },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    console.log('Dados recebidos para salvar banner:', data);
    
    // Validar dados obrigatórios
    if (!data.type) {
      console.error('Tipo do banner não fornecido');
      return NextResponse.json(
        { error: "O tipo do banner é obrigatório (ATHLETE ou CLUB)" },
        { status: 400 }
      );
    }
    
    if (!data.title) {
      console.error('Título do banner não fornecido');
      return NextResponse.json(
        { error: "O título do banner é obrigatório" },
        { status: 400 }
      );
    }
    
    if (!data.image) {
      console.error('Imagem do banner não fornecida');
      return NextResponse.json(
        { error: "A imagem do banner é obrigatória" },
        { status: 400 }
      );
    }
    
    // Processar URL da imagem
    const originalImage = data.image;
    data.image = processImageUrl(data.image);
    console.log('Processamento de URL da imagem:', { original: originalImage, processada: data.image });
    
    // Se estiver criando um novo banner ativo, desativar outros do mesmo tipo
    if (data.active && !data.id) {
      console.log(`Desativando outros banners do tipo ${data.type} para criar novo banner ativo`);
      await prisma.filiationBanner.updateMany({
        where: { 
          type: data.type,
          active: true 
        },
        data: { active: false }
      });
    }
    
    // Se estiver atualizando um banner para ativo, desativar outros do mesmo tipo
    if (data.active && data.id) {
      console.log(`Desativando outros banners do tipo ${data.type} ao atualizar banner ${data.id} para ativo`);
      await prisma.filiationBanner.updateMany({
        where: { 
          type: data.type,
          active: true,
          id: { not: data.id }
        },
        data: { active: false }
      });
    }
    
    let banner;
    
    // Atualizar banner existente
    if (data.id) {
      console.log(`Atualizando banner existente com ID: ${data.id}`);
      banner = await prisma.filiationBanner.update({
        where: { id: data.id },
        data: {
          title: data.title,
          image: data.image,
          buttonText: data.buttonText || null,
          buttonUrl: data.buttonUrl || null,
          buttonPosition: data.buttonPosition || 'bottom-right',
          active: data.active === undefined ? true : data.active,
          type: data.type,
          updatedAt: new Date()
        }
      });
    } 
    // Criar novo banner
    else {
      console.log(`Criando novo banner do tipo: ${data.type}`);
      banner = await prisma.filiationBanner.create({
        data: {
          id: `${data.type.toLowerCase()}-${Date.now()}`,
          title: data.title,
          image: data.image,
          buttonText: data.buttonText || null,
          buttonUrl: data.buttonUrl || null,
          buttonPosition: data.buttonPosition || 'bottom-right',
          active: data.active === undefined ? true : data.active,
          type: data.type,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    console.log('Banner salvo com sucesso:', banner);
    return NextResponse.json(banner);
  } catch (error) {
    console.error("Erro ao salvar banner de filiação:", error);
    return NextResponse.json(
      { error: "Erro ao salvar banner de filiação" },
      { status: 500 }
    );
  }
}

// DELETE - Remover banner de filiação
export async function DELETE(request: Request) {
  try {
    // Verificar autenticação e permissão
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }
    
    // Verificar se é admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: "Permissão negada" },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "ID não fornecido" },
        { status: 400 }
      );
    }
    
    await prisma.filiationBanner.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir banner de filiação:", error);
    return NextResponse.json(
      { error: "Erro ao excluir banner de filiação" },
      { status: 500 }
    );
  }
}
