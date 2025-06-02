import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
    
    console.log('Processando URL de logomarca de parceiro:', { original: imageUrl, processada: encodedPath });
    
    // Gerar URL via proxy do Next.js
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_BASE_URL) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL.replace(/[\[\]\(\)]/g, '').replace(/\/+$/, '');
      return `${baseUrl}/storage/${encodedPath}`;
    }
    
    return `/storage/${encodedPath}`;
  } catch (error) {
    console.error('Erro ao processar URL de logomarca:', error);
    return imageUrl; // Fallback para a URL original em caso de erro
  }
}

// GET - Lista todos os parceiros ativos
export async function GET() {
  try {
    const partners = await prisma.partner.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });

    try {
      // Processar URLs diretamente em vez de usar storageService.getUrl
      const partnersWithUrls = partners.map(partner => ({
        ...partner,
        logo: processImageUrl(partner.logo)
      }));

      return NextResponse.json(partnersWithUrls);
    } catch (error) {
      console.error('Erro ao processar URLs de logomarcas:', error);
      // Retorna os parceiros sem converter as URLs em caso de erro
      return NextResponse.json(partners);
    }
  } catch (error) {
    console.error('Erro ao buscar parceiros:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar parceiros' },
      { status: 500 }
    );
  }
}

// POST - Cria um novo parceiro
export async function POST(request: NextRequest) {
  try {
    const { name, logo, link, order } = await request.json();
    const now = new Date();
    
    const partner = await prisma.partner.create({
      data: {
        id: crypto.randomUUID(),
        name,
        logo,
        link: link || null,
        order: order || 0,
        active: true,
        createdAt: now,
        updatedAt: now
      },
    });
    return NextResponse.json(partner, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar parceiro:', error);
    return NextResponse.json(
      { error: 'Erro ao criar parceiro' },
      { status: 500 }
    );
  }
}

// PUT - Atualiza um parceiro existente
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'ID do parceiro não fornecido' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const partner = await prisma.partner.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.logo && { logo: data.logo }),
        ...(data.link !== undefined && { link: data.link }),
        ...(typeof data.order === 'number' && { order: data.order }),
        ...(typeof data.active === 'boolean' && { active: data.active }),
        updatedAt: new Date()
      },
    });
    return NextResponse.json(partner);
  } catch (error) {
    console.error('Erro ao atualizar parceiro:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar parceiro' },
      { status: 500 }
    );
  }
}

// DELETE - Remove um parceiro
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'ID do parceiro não fornecido' },
        { status: 400 }
      );
    }

    await prisma.partner.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erro ao excluir parceiro:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir parceiro' },
      { status: 500 }
    );
  }
}
