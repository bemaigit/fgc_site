import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from '@/lib/storage';

// Função para processar URLs de imagens
function processImageUrl(imageUrl: string): string {
  if (!imageUrl) return '';
  
  // Se já for uma URL relativa ou processada, retorna como está
  if (imageUrl.startsWith('/storage/') || imageUrl.startsWith('/images/')) {
    return imageUrl;
  }
  
  try {
    // Extrai o caminho da URL original do MinIO (remove http://localhost:9000/)
    let path = imageUrl;
    
    // Remover protocolo e domínio se presente
    if (path.includes('://')) {
      try {
        // Usar objeto URL para extrair o pathname de forma mais robusta
        const urlObj = new URL(path);
        path = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
      } catch (error) {
        // Fallback para o método de split em caso de erro
        const parts = path.split('/');
        path = parts.slice(3).join('/');
      }
    }
    
    // Remover prefixo "storage/" se já existir no caminho para evitar duplicação
    path = path.replace(/^storage\//, '');
    // Corrigir duplicação de "storage/storage/" 
    path = path.replace(/^storage\/storage\//, 'storage/');
    
    // Garantir que espaços e caracteres especiais sejam codificados corretamente
    const encodedPath = path.split('/').map(part => encodeURIComponent(part)).join('/');
    
    console.log('Processando URL de imagem:', { 
      original: imageUrl, 
      limpa: path,
      processada: encodedPath 
    });
    
    // Gerar URL via proxy do Next.js
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_BASE_URL) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL.replace(/[\[\]\(\)]/g, '').replace(/\/+$/, '');
      return `${baseUrl}/api/banner/image?path=${encodedPath}`;
    }
    
    return `/api/banner/image?path=${encodedPath}`;
  } catch (error) {
    console.error('Erro ao processar URL da imagem:', error);
    return imageUrl; // Fallback para a URL original em caso de erro
  }
}

export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });
    
    // Processar URLs de imagens
    const processedBanners = banners.map(banner => ({
      ...banner,
      image: processImageUrl(banner.image)
    }));
    
    return NextResponse.json(processedBanners);
  } catch (error) {
    console.error('Erro ao buscar banners:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar banners' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
    return NextResponse.json(
      { error: 'Acesso negado' },
      { status: 403 }
    );
  }

  try {
    const { title, image, link, order } = await request.json();
    const now = new Date();
    
    console.log('Dados recebidos para criar banner:', { title, image, link, order });
    
    // Extrair apenas o caminho relativo da imagem, não salvar URLs completas
    let imagePath = image;
    
    // Se for uma URL completa, extrair apenas o caminho
    if (image && image.includes('://')) {
      try {
        const urlObj = new URL(image);
        // Remover domínio e prefixos como /storage/ ou /api/
        let path = urlObj.pathname.replace(/^\/storage\//, '');
        
        // Se o caminho tiver /api/banner/image, extrair o parâmetro path da query
        if (path.includes('/api/banner/image') || path.includes('/api/filiacao/banner/image')) {
          const imageParams = new URLSearchParams(urlObj.search);
          const queryPath = imageParams.get('path');
          if (queryPath) {
            path = queryPath;
            console.log('Extraído caminho do parâmetro query:', path);
          }
        }
        
        imagePath = path;
        console.log('URL de imagem processada para armazenamento:', { original: image, processada: imagePath });
      } catch (error) {
        console.error('Erro ao processar URL de imagem para salvar:', error);
      }
    }
    
    const banner = await prisma.banner.create({
      data: {
        id: uuidv4(),
        title,
        image: imagePath, // Salvar apenas o caminho, não a URL completa
        link: link || null,
        order: order || 0,
        active: true,
        createdAt: now,
        updatedAt: now,
        createdBy: session.user.id,
        updatedBy: session.user.id
      },
    });
    
    console.log('Banner criado com sucesso:', banner);
    
    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar banner:', error);
    return NextResponse.json(
      { error: 'Erro ao criar banner' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
    return NextResponse.json(
      { error: 'Acesso negado' },
      { status: 403 }
    );
  }

  try {
    const { id, title, image, link, order, active } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do banner é obrigatório' },
        { status: 400 }
      );
    }
    
    console.log('Dados recebidos para atualizar banner:', { id, title, image, link, order, active });
    
    // Extrair apenas o caminho relativo da imagem, não salvar URLs completas
    let imagePath = image;
    
    // Se for uma URL completa, extrair apenas o caminho
    if (image && image.includes('://')) {
      try {
        const urlObj = new URL(image);
        // Remover domínio e prefixos como /storage/ ou /api/
        let path = urlObj.pathname.replace(/^\/storage\//, '');
        
        // Se o caminho tiver /api/banner/image, extrair o parâmetro path da query
        if (path.includes('/api/banner/image') || path.includes('/api/filiacao/banner/image')) {
          const imageParams = new URLSearchParams(urlObj.search);
          const queryPath = imageParams.get('path');
          if (queryPath) {
            path = queryPath;
            console.log('Extraído caminho do parâmetro query:', path);
          }
        }
        
        imagePath = path;
        console.log('URL de imagem processada para armazenamento:', { original: image, processada: imagePath });
      } catch (error) {
        console.error('Erro ao processar URL de imagem para salvar:', error);
      }
    }
    
    const banner = await prisma.banner.update({
      where: { id },
      data: {
        title,
        image: imagePath, // Salvar apenas o caminho, não a URL completa
        link: link || null,
        order: order || 0,
        active: active !== undefined ? active : true,
        updatedAt: new Date(),
        updatedBy: session.user.id
      },
    });
    
    console.log('Banner atualizado com sucesso:', banner);
    
    return NextResponse.json(banner);
  } catch (error) {
    console.error('Erro ao atualizar banner:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar banner' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
    return NextResponse.json(
      { error: 'Acesso negado' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'ID do banner não fornecido' },
        { status: 400 }
      );
    }

    await prisma.banner.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erro ao excluir banner:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir banner' },
      { status: 500 }
    );
  }
}
