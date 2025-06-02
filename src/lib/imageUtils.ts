import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

interface FallbackOptions {
  category: string; // Nome do diretório onde buscar a imagem de fallback
  variant?: string; // Nome do arquivo (sem extensão) ou 'default'
  contentType?: string; // Content-Type da imagem
}

/**
 * Utilitário para gerenciar fallbacks de imagens quando não encontradas no MinIO
 */
export class ImageFallbackManager {
  /**
   * Retorna uma imagem de placeholder quando a imagem original não é encontrada
   * @param options Opções de fallback
   * @returns NextResponse com a imagem de fallback ou null se não encontrada
   */
  static getFallbackImage(options: FallbackOptions): NextResponse | null {
    const { category, variant = 'default' } = options;
    let contentType = options.contentType;
    
    try {
      // Determinar a extensão com base no content type ou usar jpg como padrão
      let extension = 'jpg';
      if (contentType) {
        if (contentType.includes('png')) extension = 'png';
        else if (contentType.includes('gif')) extension = 'gif';
        else if (contentType.includes('webp')) extension = 'webp';
      }
      
      // Nome do arquivo baseado no variant
      const fileName = variant === 'default' ? `default.${extension}` : variant;
      
      // Caminho completo para o arquivo de placeholder
      const placeholderPath = path.join(process.cwd(), 'public', 'placeholder', category, fileName);
      
      // Verificar se o diretório existe
      const categoryDir = path.join(process.cwd(), 'public', 'placeholder', category);
      if (!fs.existsSync(categoryDir)) {
        console.log(`[ImageFallbackManager] Diretório não encontrado: ${categoryDir}`);
        return null;
      }
      
      // Verificar se o arquivo existe com a extensão específica
      if (fs.existsSync(placeholderPath)) {
        const placeholderBuffer = fs.readFileSync(placeholderPath);
        
        // Determinar o content type com base na extensão do arquivo
        const finalContentType = contentType || (
          placeholderPath.endsWith('.png') ? 'image/png' :
          placeholderPath.endsWith('.gif') ? 'image/gif' :
          placeholderPath.endsWith('.webp') ? 'image/webp' :
          'image/jpeg'
        );
        
        console.log(`[ImageFallbackManager] Servindo imagem de fallback: ${placeholderPath}`);
        
        return new NextResponse(placeholderBuffer, {
          headers: {
            'Content-Type': finalContentType,
            'Cache-Control': 'public, max-age=86400',
            'X-Image-Fallback': 'true'
          },
        });
      }
      
      // Se não encontrou com a extensão específica e é um fallback default,
      // tentar outras extensões comuns
      if (variant === 'default') {
        const commonExtensions = ['jpg', 'png', 'webp'];
        
        for (const ext of commonExtensions) {
          if (ext !== extension) { // Já verificamos a extensão original
            const altPath = path.join(process.cwd(), 'public', 'placeholder', category, `default.${ext}`);
            if (fs.existsSync(altPath)) {
              const placeholderBuffer = fs.readFileSync(altPath);
              
              // Determinar content type com base na extensão
              const altContentType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
              
              console.log(`[ImageFallbackManager] Servindo imagem de fallback com extensão alternativa: ${altPath}`);
              
              return new NextResponse(placeholderBuffer, {
                headers: {
                  'Content-Type': altContentType,
                  'Cache-Control': 'public, max-age=86400',
                  'X-Image-Fallback': 'true'
                },
              });
            }
          }
        }
      }
      
      console.error(`[ImageFallbackManager] Fallback não encontrado para ${category}/${variant}`);
      return null;
    } catch (error) {
      console.error(`[ImageFallbackManager] Erro ao buscar fallback:`, error);
      return null;
    }
  }

  /**
   * Retorna todas as categorias de imagens com seus fallbacks disponíveis
   * @returns Mapa de categorias e seus fallbacks
   */
  static listAvailableFallbacks() {
    const result: Record<string, string[]> = {};
    const basePath = path.join(process.cwd(), 'public', 'placeholder');
    
    try {
      // Listar todos os diretórios de categorias
      const categories = fs.readdirSync(basePath).filter(item => {
        const itemPath = path.join(basePath, item);
        return fs.statSync(itemPath).isDirectory();
      });
      
      // Para cada categoria, listar os fallbacks disponíveis
      for (const category of categories) {
        const categoryPath = path.join(basePath, category);
        const files = fs.readdirSync(categoryPath).filter(file => {
          const filePath = path.join(categoryPath, file);
          return fs.statSync(filePath).isFile() && /\.(jpg|jpeg|png|gif|webp)$/i.test(file);
        });
        
        result[category] = files;
      }
      
      return result;
    } catch (error) {
      console.error(`[ImageFallbackManager] Erro ao listar fallbacks:`, error);
      return {};
    }
  }
}
