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
      // Pegar tudo após o domínio e a porta
      const parts = path.split('/');
      // Ignorar protocolo://domínio:porta e juntar o resto
      path = parts.slice(3).join('/');
    }
    
    // Garantir que espaços e caracteres especiais sejam codificados corretamente
    const encodedPath = path.split('/').map(part => encodeURIComponent(part)).join('/');
    
    console.log('Processando URL de small banner:', { original: imageUrl, processada: encodedPath });
    
    // Gerar URL diretamente sem usar storageService
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_BASE_URL) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL.replace(/[\[\]\(\)]/g, '').replace(/\/+$/, '');
      return `${baseUrl}/storage/${encodedPath}`;
    }
    
    return `/storage/${encodedPath}`;
  } catch (error) {
    console.error('Erro ao processar URL da imagem de small banner:', error);
    return imageUrl; // Fallback para a URL original em caso de erro
  }
}

export async function GET() {
  try {
    const banners = await prisma.smallBanner.findMany({
      where: { active: true },
      orderBy: { position: 'asc' },
    });
    
    // Processar URLs de imagens
    const processedBanners = banners.map(banner => ({
      ...banner,
      image: processImageUrl(banner.image)
    }));
    
    return NextResponse.json(processedBanners);
  } catch (error) {
    console.error('Erro ao buscar banners pequenos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar banners pequenos' },
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
    const { title, image, link, position } = await request.json();
    const now = new Date();
    
    const banner = await prisma.smallBanner.create({
      data: {
        id: uuidv4(),
        title,
        image: processImageUrl(image),
        link: link || null,
        position: position || 0,
        active: true,
        createdAt: now,
        updatedAt: now,
        createdBy: session.user.id,
        updatedBy: session.user.id
      },
    });
    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar banner pequeno:', error);
    return NextResponse.json(
      { error: 'Erro ao criar banner pequeno' },
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'ID do banner não fornecido' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const banner = await prisma.smallBanner.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.image && { image: processImageUrl(data.image) }),
        ...(data.link !== undefined && { link: data.link }),
        ...(typeof data.position === 'number' && { position: data.position }),
        ...(typeof data.active === 'boolean' && { active: data.active }),
        updatedAt: new Date(),
        updatedBy: session.user.id
      },
    });
    return NextResponse.json(banner);
  } catch (error) {
    console.error('Erro ao atualizar banner pequeno:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar banner pequeno' },
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

    await prisma.smallBanner.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erro ao excluir banner pequeno:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir banner pequeno' },
      { status: 500 }
    );
  }
}
