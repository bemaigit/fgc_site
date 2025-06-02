import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processPartnerImageUrl } from '@/lib/processPartnerImageUrl';

// A função processPartnerImageUrl está sendo importada do lib

// GET - Lista todos os parceiros ativos (endpoint público)
export async function GET() {
  try {
    console.log('Iniciando busca de parceiros ativos');

    const partners = await prisma.partner.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });

    console.log(`Parceiros encontrados: ${partners.length}`);

    // Usa a função processPartnerImageUrl para processar as URLs dos logos
    console.log('Processando URLs dos logos dos parceiros');
    const partnersWithUrls = partners.map(partner => {
      // Processa a URL usando nossa função utilitária
      const processedUrl = processPartnerImageUrl(partner.logo);
      console.log(`Logo processado: ${partner.logo} -> ${processedUrl}`);
      
      return {
        ...partner,
        logo: processedUrl
      };
    });

    return NextResponse.json(partnersWithUrls);
  } catch (error) {
    console.error('Erro detalhado ao buscar parceiros:', {
      error,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Erro ao buscar parceiros', details: error },
      { status: 500 }
    );
  }
}
