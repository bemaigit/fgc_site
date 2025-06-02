'use client'

import { useEffect, useRef, useState } from 'react'
import { NewsCard } from './NewsCard'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface News {
  id: string
  title: string
  coverImage: string | null
  excerpt: string | null
  publishedAt: string | null
  slug: string
}

interface NewsApiItem {
  id: string
  title: string
  coverImage: string | null
  excerpt: string | null
  publishedAt: string | null
  slug: string | null
  [key: string]: string | null | number | boolean
}

interface NewsApiResponse {
  data: NewsApiItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

interface NewsSliderProps {
  className?: string
}

export function NewsSlider({ className }: NewsSliderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [news, setNews] = useState<News[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchNews() {
      try {
        console.log('Buscando notícias publicadas...')
        const response = await fetch('/api/news?published=true&limit=10')
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('Resposta da API não ok:', errorData)
          throw new Error(errorData.error || 'Falha ao carregar notícias')
        }
        
        const data: NewsApiResponse = await response.json()
        console.log('Notícias recebidas:', data)
        
        // Mapeia os dados para o formato esperado pelo componente
        const newsData = data.data.map((item) => ({
          id: item.id,
          title: item.title,
          coverImage: item.coverImage,
          excerpt: item.excerpt,
          publishedAt: item.publishedAt,
          slug: item.slug || '' // Garante que slug nunca será null
        }))
        
        setNews(newsData)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar notícias'
        console.error('Erro detalhado:', err)
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNews()
  }, [])

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const scrollAmount = container.clientWidth
    const scrollTo = direction === 'left' 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount

    container.scrollTo({
      left: scrollTo,
      behavior: 'smooth'
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-gray-500">
        {error}
      </div>
    )
  }

  if (!news.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhuma notícia disponível no momento
      </div>
    )
  }

  return (
    <div className={cn("relative group touch-pan-x -mx-3 sm:-mx-0", className)}>
      {/* Botão Ver todas as notícias - posicionado no topo */}
      <div className="flex justify-end items-center mb-4">
        <Link 
          href="/noticias" 
          className="text-sm text-[#08285d] hover:text-[#7db0de] flex items-center"
        >
          Ver todas <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>
      
      {/* Container com scroll horizontal */}
      <div
        ref={scrollContainerRef}
        className="
          overflow-x-auto
          scrollbar-hide
          snap-x
          snap-mandatory
          grid
          grid-flow-col
          auto-cols-[calc(70%-0.75rem)]
          sm:auto-cols-[calc(50%-0.75rem)]
          lg:auto-cols-[calc(35%-0.75rem)]
          gap-4
          pb-4
          -mb-4
        "
      >
        {news.map((item) => (
          <div key={item.id} className="snap-start flex justify-center items-center">
            <div style={{ transform: 'scale(0.9)', transformOrigin: 'center center', width: '100%', height: '100%' }}>
              <NewsCard
                id={item.id}
                title={item.title}
                coverImage={item.coverImage}
                excerpt={item.excerpt}
                publishedAt={item.publishedAt}
                slug={item.slug}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Botões de navegação */}
      <div className="absolute inset-y-0 left-0 hidden md:flex items-center">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow-lg -ml-4 border"
          onClick={() => handleScroll('left')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      <div className="absolute inset-y-0 right-0 hidden md:flex items-center">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow-lg -mr-4 border"
          onClick={() => handleScroll('right')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

    </div>
  )
}
