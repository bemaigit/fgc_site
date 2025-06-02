import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { storageService } from '@/lib/storage';

// GET - Lista todos os patrocinadores ativos
export async function GET(request: NextRequest) {
  try {
    // Verifica se estamos buscando um patrocinador específico pelo ID
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      const sponsor = await prisma.sponsor.findUnique({
        where: { id }
      });
      
      if (!sponsor) {
        return NextResponse.json(
          { error: 'Patrocinador não encontrado' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(sponsor);
    }
    
    // Buscar todos os patrocinadores (para o admin)
    const sponsors = await prisma.sponsor.findMany({
      orderBy: { order: 'asc' },
    });

    try {
      // Obter a base URL do ambiente ou do request
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
        (request.headers.get('host') ? 
          `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}` : 
          'http://localhost:3000');
      
      // Processar as imagens para usar nosso endpoint de proxy
      const sponsorsWithUrls = sponsors.map(sponsor => {
        // Processar o logo (caminho da imagem)
        let path = sponsor.logo;
        
        // Se for uma URL completa, extrair apenas o caminho
        if (path.includes('://')) {
          try {
            const urlObj = new URL(path);
            path = urlObj.pathname
              .replace(/^\/storage\//, '')
              .replace(/^\/fgc\//, '');
          } catch (error) {
            console.error('Erro ao processar URL do logo:', error);
          }
        }
        
        // Se ainda não tem o prefixo patrocinadores, adicionar
        if (!path.startsWith('patrocinadores/')) {
          const filename = path.split('/').pop() || path;
          path = `patrocinadores/${filename}`;
        }
        
        // Construir URL para o proxy de imagens
        const proxyUrl = `${baseUrl}/api/sponsor/image?path=${encodeURIComponent(path)}`;
        
        return {
          ...sponsor,
          logo: proxyUrl
        };
      });

      return NextResponse.json(sponsorsWithUrls);
    } catch (error) {
      console.error('Erro ao processar URLs de patrocinadores:', error);
      // Retorna os patrocinadores sem converter as URLs em caso de erro
      return NextResponse.json(sponsors);
    }
  } catch (error) {
    console.error('Erro ao buscar patrocinadores:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar patrocinadores' },
      { status: 500 }
    );
  }
}

// POST - Cria um novo patrocinador
export async function POST(request: NextRequest) {
  try {
    // Extrair e validar os dados da requisição
    const body = await request.json();
    console.log('Dados recebidos para criar patrocinador:', body);
    
    const { name, logo, link, order } = body;
    
    if (!name) {
      console.error('Nome do patrocinador não fornecido');
      return NextResponse.json(
        { error: 'Nome do patrocinador é obrigatório' },
        { status: 400 }
      );
    }
    
    if (!logo) {
      console.error('Logo do patrocinador não fornecido');
      return NextResponse.json(
        { error: 'Logo do patrocinador é obrigatório' },
        { status: 400 }
      );
    }
    
    const now = new Date();
    
    // Gerar um UUID compatível usando o método do Node.js
    const { randomUUID } = require('crypto');
    const sponsorId = randomUUID();
    
    console.log('Tentando criar patrocinador com ID:', sponsorId);
    
    // Criar o patrocinador no banco de dados
    const sponsor = await prisma.sponsor.create({
      data: {
        id: sponsorId,
        name,
        logo,
        link: link || null,
        order: order || 0,
        active: true,
        createdAt: now,
        updatedAt: now
      },
    });
    
    console.log('Patrocinador criado com sucesso:', sponsor);
    return NextResponse.json(sponsor, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar patrocinador:', error);
    return NextResponse.json(
      { error: `Erro ao criar patrocinador: ${error instanceof Error ? error.message : 'Erro desconhecido'}` },
      { status: 500 }
    );
  }
}

// PUT - Atualiza um patrocinador existente
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'ID do patrocinador não fornecido' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const sponsor = await prisma.sponsor.update({
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
    return NextResponse.json(sponsor);
  } catch (error) {
    console.error('Erro ao atualizar patrocinador:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar patrocinador' },
      { status: 500 }
    );
  }
}

// DELETE - Remove um patrocinador
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'ID do patrocinador não fornecido' },
        { status: 400 }
      );
    }

    await prisma.sponsor.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erro ao excluir patrocinador:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir patrocinador' },
      { status: 500 }
    );
  }
}
