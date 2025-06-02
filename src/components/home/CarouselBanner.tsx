"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

// Definindo o tipo para os banners
interface Banner {
  id: string;
  title: string;
  image: string;
  link?: string;
  order: number;
  active: boolean;
}

const CarouselBanner = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // Função para processar URLs de imagens e garantir compatibilidade com diferentes ambientes
  const processImageUrl = (url: string): string => {
    if (!url) return '';
    
    console.log('Processando URL de banner do carrossel (original):', url);
    
    // Evitar processar URLs que já são do nosso endpoint de proxy
    if (url.includes('/api/banner/image')) {
      console.log('URL já processada, retornando original:', url);
      return url;
    }
    
    // Se for URL do ngrok
    if (url.includes('ngrok-free.app')) {
      try {
        const urlObj = new URL(url);
        // Remover o '/storage/' do caminho para evitar duplicação
        const path = urlObj.pathname.replace(/^\/storage\//, '');
        
        // Verificar se o caminho parece ser um caminho de arquivo válido
        if (!path.includes('.')) {
          console.warn('Caminho não parece ser um arquivo válido:', path);
          return url; // Retornar URL original se não parece ser um arquivo
        }
        
        const encodedPath = encodeURIComponent(path);
        const processedUrl = `${urlObj.origin}/api/banner/image?path=${encodedPath}`;
        console.log('URL processada:', processedUrl);
        return processedUrl;
      } catch (error) {
        console.error('Erro ao processar URL do banner:', error);
        return url;
      }
    }
    
    // Se for URL do MinIO local
    if (url.includes('localhost:9000')) {
      try {
        const urlObj = new URL(url);
        // Extrair apenas o caminho relativo (após fgc/)
        const pathMatch = urlObj.pathname.match(/^\/fgc\/(.*)/);
        const path = pathMatch ? pathMatch[1] : urlObj.pathname;
        
        // Verificar se o caminho parece ser um caminho de arquivo válido
        if (!path.includes('.')) {
          console.warn('Caminho não parece ser um arquivo válido:', path);
          return url; // Retornar URL original se não parece ser um arquivo
        }
        
        const encodedPath = encodeURIComponent(path);
        // Usar a API proxy para entregar a imagem
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
        const processedUrl = `${baseUrl}/api/banner/image?path=${encodedPath}`;
        console.log('URL processada:', processedUrl);
        return processedUrl;
      } catch (error) {
        console.error('Erro ao processar URL do MinIO:', error);
        return url;
      }
    }
    
    // Se for uma URL que já é storage ou contém uma extensão de arquivo
    if ((url.startsWith('/storage/') || url.includes('.jpg') || url.includes('.png') || url.includes('.jpeg') || url.includes('.webp')) && !url.includes('/api/')) {
      // É provavelmente uma URL de imagem válida
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      const path = url.replace(/^\/storage\//, '');
      const encodedPath = encodeURIComponent(path);
      const processedUrl = `${baseUrl}/api/banner/image?path=${encodedPath}`;
      console.log('URL processada de caminho relativo:', processedUrl);
      return processedUrl;
    }
    
    // Para outros casos, retornar a URL original
    console.log('Não foi possível processar URL, retornando original:', url);
    return url;
  };

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        console.log('Tentando buscar banners do carrossel...');
        
        // Adicionar timeout para evitar espera infinita
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch('/api/banners', { 
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log('Resposta do servidor:', response.status, response.statusText); 
        if (!response.ok) {
          if (response.status === 404) {
            console.error('Não foi possível encontrar banners:', response.statusText);
          } else if (response.status >= 500) {
            console.error('Erro interno do servidor:', response.statusText);
          } else {
            console.error('Erro ao buscar banners:', response.statusText);
          }
          setLoading(false);
          return;
        }
        
        try {
          const data = await response.json();
          console.log('Banners carregados:', data.length);
          
          // Processar URLs de imagens no array de banners
          const processedBanners = data.map((banner: Banner) => ({
            ...banner,
            image: typeof banner.image === 'string' ? processImageUrl(banner.image) : banner.image
          }));
          
          setBanners(processedBanners);
          setLoading(false);
        } catch (error) {
          console.error('Erro ao processar resposta:', error);
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro ao carregar banners:', error);
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  if (loading) return (
    <div className="relative w-full h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px] flex items-center justify-center bg-gray-200">
      <div className="text-gray-500">Carregando...</div>
    </div>
  );

  // Se não houver banners, não exibir nada
  if (!banners || banners.length === 0) return null;

  return (
    <div className="relative w-full h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px] overflow-hidden bg-amber-900">
      <div className="absolute inset-0 flex transition-transform duration-500 ease-in-out">
        {banners.map((banner) => (
          <div key={banner.id} className="flex-shrink-0 w-full h-full">
            <Image 
              src={banner.image} 
              alt={banner.title || 'Banner'} 
              layout="fill" 
              objectFit="cover"
              onError={(e) => {
                console.error('Erro ao carregar imagem do banner:', banner.image);
                // Substituir por uma imagem de fallback que existe no projeto
                e.currentTarget.src = '/images/logo.png'; 
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CarouselBanner;
