'use client'

import { useState, useEffect } from 'react'
import './Sponsors.css'

interface Sponsor {
  id: string
  name: string
  logo: string
  link?: string | null
  order: number
  active: boolean
}

export function Sponsors() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)

  // Função para processar URLs de logos
  const processLogoUrl = (url: string): string => {
    if (!url) return '/images/logo.png';
    
    // Se a URL já contém o endpoint de proxy, usar direto a API de patrocinadores
    if (url.includes('/api/proxy/storage/')) {
      // Extrair o caminho após '/api/proxy/storage/'
      const pathMatch = url.match(/\/api\/proxy\/storage\/(.+)$/);
      if (pathMatch && pathMatch[1]) {
        return `/api/partners/image?path=${encodeURIComponent(pathMatch[1])}`;
      }
    }
    
    // Se já é uma URL de sponsor/image, retornar como está
    if (url.includes('/api/sponsor/image') || url.includes('/api/partners/image')) {
      return url;
    }
    
    // Para URLs simples sem o caminho de proxy
    if (!url.includes('://') && !url.startsWith('/')) {
      return `/api/partners/image?path=${encodeURIComponent(url)}`;
    }
    
    // Para outros formatos de URL, usar a API de sponsors
    return `/api/partners/image?path=${encodeURIComponent(url)}`;
  };

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        // Usar uma estratégia de retry com timeout mais longo para ambiente Docker
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // Aumentado para 30 segundos
        
        console.log('Iniciando busca de patrocinadores...');
        const response = await fetch('/api/public/sponsors', { 
          signal: controller.signal,
          cache: 'no-store' // Forçar sempre dados atualizados
        });
        clearTimeout(timeoutId);
        console.log('Resposta recebida de patrocinadores:', response.status);
        
        if (!response.ok) throw new Error('Erro ao buscar patrocinadores');
        const data = await response.json();
        setSponsors(data);
      } catch (error) {
        console.error('Erro ao buscar patrocinadores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSponsors();
  }, []);

  if (loading) return null;
  if (!sponsors || sponsors.length === 0) return null;

  return (
    <section className="sponsors-section" style={{ marginTop: '-35px', position: 'relative', zIndex: 10 }}>
      <div className="container mx-auto px-4 pt-0 pb-6 sm:pb-6 md:pb-6">
        {/* Título e subtítulo removidos */}
        <div className="sponsors-grid">
          {sponsors.map((sponsor) => (
            <div key={sponsor.id} className="sponsor-item">
              {sponsor.link ? (
                <a 
                  href={sponsor.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label={sponsor.name}
                  className="sponsor-link"
                >
                  <img
                    src={processLogoUrl(sponsor.logo)}
                    alt={sponsor.name}
                    loading="lazy"
                    className="sponsor-logo"
                    onError={(e) => {
                      console.log('Erro ao carregar logo do patrocinador:', sponsor.name);
                      e.currentTarget.src = '/images/logo.png';
                    }}
                  />
                </a>
              ) : (
                <img
                  src={processLogoUrl(sponsor.logo)}
                  alt={sponsor.name}
                  loading="lazy"
                  className="sponsor-logo"
                  onError={(e) => {
                    console.log('Erro ao carregar logo do patrocinador:', sponsor.name);
                    e.currentTarget.src = '/images/logo.png';
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
