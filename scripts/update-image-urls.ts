import { PrismaClient } from '@prisma/client';
import path from 'path';
import url from 'url';

const prisma = new PrismaClient();

/**
 * Extrai o caminho relativo de uma URL completa do ngrok ou storage
 */
function extractPathFromUrl(imageUrl: string): string | null {
  if (!imageUrl) return null;
  
  console.log(`Processando URL: ${imageUrl}`);
  
  try {
    // Parse da URL para extrair componentes
    const parsedUrl = new URL(imageUrl);
    
    // Se for uma URL do ngrok com caminho /storage/
    if (parsedUrl.pathname.includes('/storage/')) {
      // Extrai a parte após /storage/
      const pathAfterStorage = parsedUrl.pathname.split('/storage/')[1];
      console.log(`Caminho extraído após /storage/: ${pathAfterStorage}`);
      return pathAfterStorage;
    }
    
    // Se for uma URL com /api/filiacao/banner/image ou /api/banner/image
    if (parsedUrl.pathname.includes('/api/')) {
      // Extrai o parâmetro path da query
      const pathParam = parsedUrl.searchParams.get('path');
      if (pathParam) {
        console.log(`Caminho extraído do parâmetro path: ${pathParam}`);
        return decodeURIComponent(pathParam);
      }
    }
    
    // Verificar se a URL é do MinIO diretamente
    if (parsedUrl.hostname.includes('localhost') && parsedUrl.pathname.includes('/fgc/')) {
      const pathAfterBucket = parsedUrl.pathname.split('/fgc/')[1];
      console.log(`Caminho extraído após /fgc/: ${pathAfterBucket}`);
      return pathAfterBucket;
    }
    
    // Se chegou aqui, não conseguimos extrair o caminho
    console.log(`Não foi possível extrair caminho da URL: ${imageUrl}`);
    return null;
  } catch (error) {
    console.error(`Erro ao processar URL ${imageUrl}:`, error);
    return null;
  }
}

/**
 * Atualiza banners de filiação (atleta e clube)
 */
async function updateFiliationBanners() {
  const banners = await prisma.filiationBanner.findMany();
  console.log(`Encontrados ${banners.length} banners de filiação para processar`);
  
  let updatedCount = 0;
  
  for (const banner of banners) {
    if (!banner.image) continue;
    
    // Verifica se a URL contém ngrok ou localhost
    if (banner.image.includes('ngrok') || banner.image.includes('localhost')) {
      const relativePath = extractPathFromUrl(banner.image);
      
      if (relativePath) {
        // Atualiza no banco de dados
        await prisma.filiationBanner.update({
          where: { id: banner.id },
          data: { image: relativePath }
        });
        updatedCount++;
        console.log(`Banner de filiação atualizado: ${banner.id}, novo caminho: ${relativePath}`);
      }
    }
  }
  
  console.log(`Total de ${updatedCount} banners de filiação atualizados`);
}

/**
 * Atualiza banners de carousel
 */
async function updateCarouselBanners() {
  const banners = await prisma.banner.findMany();
  console.log(`Encontrados ${banners.length} banners de carousel para processar`);
  
  let updatedCount = 0;
  
  for (const banner of banners) {
    if (!banner.image) continue;
    
    // Verifica se a URL contém ngrok ou localhost
    if (banner.image.includes('ngrok') || banner.image.includes('localhost')) {
      const relativePath = extractPathFromUrl(banner.image);
      
      if (relativePath) {
        // Atualiza no banco de dados
        await prisma.banner.update({
          where: { id: banner.id },
          data: { image: relativePath }
        });
        updatedCount++;
        console.log(`Banner de carousel atualizado: ${banner.id}, novo caminho: ${relativePath}`);
      }
    }
  }
  
  console.log(`Total de ${updatedCount} banners de carousel atualizados`);
}

/**
 * Atualiza imagens de patrocinadores
 */
async function updateSponsors() {
  const sponsors = await prisma.sponsor.findMany();
  console.log(`Encontrados ${sponsors.length} patrocinadores para processar`);
  
  let updatedCount = 0;
  
  for (const sponsor of sponsors) {
    if (!sponsor.logo) continue;
    
    // Verifica se a URL contém ngrok ou localhost
    if (sponsor.logo.includes('ngrok') || sponsor.logo.includes('localhost')) {
      const relativePath = extractPathFromUrl(sponsor.logo);
      
      if (relativePath) {
        // Atualiza no banco de dados
        await prisma.sponsor.update({
          where: { id: sponsor.id },
          data: { logo: relativePath }
        });
        updatedCount++;
        console.log(`Patrocinador atualizado: ${sponsor.id}, novo caminho: ${relativePath}`);
      }
    }
  }
  
  console.log(`Total de ${updatedCount} patrocinadores atualizados`);
}

/**
 * Atualiza imagens de parceiros
 */
async function updatePartners() {
  const partners = await prisma.partner.findMany();
  console.log(`Encontrados ${partners.length} parceiros para processar`);
  
  let updatedCount = 0;
  
  for (const partner of partners) {
    if (!partner.logo) continue;
    
    // Verifica se a URL contém ngrok ou localhost
    if (partner.logo.includes('ngrok') || partner.logo.includes('localhost')) {
      const relativePath = extractPathFromUrl(partner.logo);
      
      if (relativePath) {
        // Atualiza no banco de dados
        await prisma.partner.update({
          where: { id: partner.id },
          data: { logo: relativePath }
        });
        updatedCount++;
        console.log(`Parceiro atualizado: ${partner.id}, novo caminho: ${relativePath}`);
      }
    }
  }
  
  console.log(`Total de ${updatedCount} parceiros atualizados`);
}

/**
 * Função principal para executar todas as atualizações
 */
async function main() {
  console.log('Iniciando processo de atualização de URLs de imagens...');
  
  try {
    await updateFiliationBanners();
    await updateCarouselBanners();
    await updateSponsors();
    await updatePartners();
    
    console.log('Processo de atualização concluído com sucesso!');
  } catch (error) {
    console.error('Erro durante o processo de atualização:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executa o script
main();
