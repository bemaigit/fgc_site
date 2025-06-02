'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight } from 'lucide-react'

// Função para carregar imagens de banners corretamente
function getImageUrl(url: string): string {
  if (!url) return '/images/placeholder-banner.jpg';
  
  // Tratamento especial para banners da seção de atletas que contém espaços no caminho
  if (url.includes('Banner conheça atletas') || url.includes('Banner%20conhe%C3%A7a%20atletas')) {
    // Obter o nome do arquivo (parte final do caminho)
    const filename = url.split('/').pop();
    if (filename) {
      // Caminho direto da imagem no diretório "Banner conheça atletas"
      return `/api/proxy/storage/Banner conheça atletas/${filename}`;
    }
  }
  
  // Se o URL já incluir proxy/storage, mantê-lo como está
  if (url.includes('/api/proxy/storage/')) {
    return url;
  }
  
  // Para URLs simples sem o caminho de proxy
  if (!url.includes('://') && !url.startsWith('/')) {
    // Adicionar o caminho proxy correto
    return `/api/proxy/storage/${url}`;
  }
  
  // Para outros formatos de URL, retornar como está
  return url;
}

interface AthletesSectionBannerProps {
  className?: string
}

interface BannerData {
  id: string
  imageUrl: string
  title: string
  subtitle?: string
  description?: string
  buttonText?: string
  buttonUrl?: string
  order: number
}

export function AthletesSectionBanner({ className = '' }: AthletesSectionBannerProps) {
  const [banner, setBanner] = useState<BannerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBanner() {
      try {
        setLoading(true)
        const response = await fetch('/api/athletes-banner')
        
        if (!response.ok) {
          throw new Error('Falha ao carregar banner dos atletas')
        }
        
        const data = await response.json()
        
        // Pegamos o primeiro banner se houver algum
        if (data && data.length > 0) {
          setBanner(data[0])
        }
        
        setError(null)
      } catch (err) {
        console.error('Erro ao carregar banner dos atletas:', err)
        setError('Não foi possível carregar a seção de atletas')
      } finally {
        setLoading(false)
      }
    }
    
    fetchBanner()
  }, [])
  
  // Se estiver carregando ou houver erro, não mostra nada
  if (loading) {
    return null
  }
  
  // Se não houver banner, não mostra nada
  if (!banner) {
    return null
  }

  return (
    <section 
      className={`relative overflow-hidden ${className} cursor-pointer hover:opacity-95 transition-opacity`}
      onClick={() => window.location.href = '/atletas'}
    >
      {/* Banner com efeito de escurecimento */}
      <div className="relative w-full h-96 md:h-[500px]">
        {/* Imagem de fundo */}
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={getImageUrl(banner.imageUrl)}
            alt={banner.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
            onError={(e) => {
              console.error('Erro ao carregar imagem do banner:', banner.imageUrl)
              const target = e.target as HTMLImageElement
              target.src = '/images/placeholder-banner.jpg'
              target.onerror = null
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" />
        </div>
        
        {/* Conteúdo do banner */}
        <div className="relative h-full container mx-auto px-4 flex flex-col justify-center z-10">
          <div className="max-w-2xl text-white">
            {banner.subtitle && (
              <p className="text-yellow-400 font-semibold mb-2">{banner.subtitle}</p>
            )}
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{banner.title}</h2>
            {banner.description && (
              <p className="text-lg text-gray-100 mb-8">{banner.description}</p>
            )}
            {banner.buttonText && (
              <Link 
                href="/atletas"
                className="inline-flex items-center px-6 py-3 bg-yellow-500 text-black font-semibold rounded-md hover:bg-yellow-400 transition duration-200"
                onClick={(e) => {
                  e.stopPropagation(); // Evita que o clique do botão acione também o clique do banner
                }}
              >
                {banner.buttonText}
                <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
