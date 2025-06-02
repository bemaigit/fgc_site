'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Camera } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { processGalleryImageUrl } from '@/lib/processGalleryImageUrl'

type Gallery = {
  id: string
  title: string
  slug: string
  date: string
  imageCount: number
  coverImage: string
}

export function GallerySlider() {
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGalleries() {
      try {
        const response = await fetch('/api/gallery/recent')
        
        if (!response.ok) {
          throw new Error('Falha ao carregar galerias')
        }
        
        const data = await response.json()
        setGalleries(data.galleries)
      } catch (error) {
        console.error('Erro ao carregar galerias:', error)
        setError('Não foi possível carregar as galerias. Tente novamente mais tarde.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGalleries()
  }, [])

  const scrollLeft = () => {
    const container = document.getElementById('gallery-slider-container')
    if (container) {
      container.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    const container = document.getElementById('gallery-slider-container')
    if (container) {
      container.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  if (isLoading) {
    return (
      <div className="relative">
        <div className="flex justify-end items-center mb-4">
          <Link 
            href="/galeria" 
            className="text-sm text-[#08285d] hover:text-[#7db0de] flex items-center"
          >
            Ver todas <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        <div className="flex gap-6 overflow-hidden pb-4">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="flex-shrink-0 w-[45%] sm:w-[42%] md:w-[300px]">
              <Skeleton className="h-[120px] sm:h-[150px] md:h-[200px] w-full rounded-lg" />
              <Skeleton className="h-5 w-3/4 mt-3" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  if (galleries.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-zinc-500">Nenhuma galeria disponível no momento.</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex justify-end items-center mb-4">
        <Link 
          href="/galeria" 
          className="text-sm text-[#08285d] hover:text-[#7db0de] flex items-center"
        >
          Ver todas <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>

      <div className="absolute left-0 sm:-left-2 md:-left-4 top-1/2 transform -translate-y-1/2 z-10">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-full bg-white/80 shadow-md border-zinc-200 hover:bg-white hover:bg-opacity-100"
          onClick={scrollLeft}
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-700" />
        </Button>
      </div>

      <div 
        id="gallery-slider-container"
        className="flex gap-3 sm:gap-4 md:gap-6 overflow-x-auto hide-scrollbar pb-4 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {galleries.map((gallery) => (
          <Link
            href={`/galeria/${gallery.slug}`}
            key={gallery.id}
            className="group block bg-white rounded-xl border-2 border-[#08285d] shadow-[0_2px_6px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.18)] transition-all duration-300 overflow-hidden"
          >
            <div className="relative h-[120px] sm:h-[150px] md:h-[200px] overflow-hidden">
              <Image
                src={processGalleryImageUrl(gallery.coverImage)}
                alt={gallery.title}
                fill
                className="object-cover transition-transform group-hover:scale-105 duration-300"
                priority={true}
                onError={(e) => {
                  // Log detalhado para depuração
                  console.error(`Erro ao carregar imagem da galeria: ${gallery.title}`, {
                    originalUrl: gallery.coverImage,
                    processedUrl: processGalleryImageUrl(gallery.coverImage)
                  });
                  
                  // Usar imagem de fallback
                  e.currentTarget.src = '/images/gallery-placeholder.jpg';
                  
                  // Adicionar classe para ajustar estilos quando usando fallback
                  e.currentTarget.classList.add('image-fallback');
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-60" />
              <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md flex items-center">
                <Camera className="h-3 w-3 mr-1" />
                <span>{gallery.imageCount}</span>
              </div>
            </div>
            <div className="px-2 sm:px-3">
              <h3 className="font-medium mt-2 text-sm sm:text-base md:text-base text-zinc-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                {gallery.title}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                {new Date(gallery.date).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="absolute right-0 sm:-right-2 md:-right-4 top-1/2 transform -translate-y-1/2 z-10">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-full bg-white/80 shadow-md border-zinc-200 hover:bg-white hover:bg-opacity-100"
          onClick={scrollRight}
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-700" />
        </Button>
      </div>
    </div>
  )
}
