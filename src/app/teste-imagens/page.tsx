'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface NewsImage {
  id: string
  url: string
  alt?: string
  news_id: string
  image_order: number
  created_at: string
}

interface NewsWithImages {
  id: string
  title: string
  slug: string
  imageCount: number
  images: NewsImage[]
}

export default function TesteImagens() {
  const [newsWithImages, setNewsWithImages] = useState<NewsWithImages[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchImagens() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/debug/newsimages')
        
        if (!response.ok) {
          throw new Error('Falha ao carregar imagens')
        }
        
        const data = await response.json()
        console.log('Dados recebidos:', data)
        setNewsWithImages(data.newsWithImages || [])
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar imagens'
        console.error('Erro detalhado:', err)
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchImagens()
  }, [])

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <h1 className="text-2xl font-bold mb-6">Carregando imagens...</h1>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-12">
        <h1 className="text-2xl font-bold mb-6">Erro ao carregar imagens</h1>
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">Teste de Imagens</h1>
      
      {newsWithImages.length === 0 ? (
        <p>Nenhuma notícia com imagens encontrada.</p>
      ) : (
        <div className="space-y-12">
          {newsWithImages.map((news) => (
            <div key={news.id} className="border p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">
                <Link href={`/noticias/${news.slug}`} className="text-blue-600 hover:underline">
                  {news.title}
                </Link>
              </h2>
              <p className="mb-4">Total de imagens: {news.imageCount}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {news.images.map((image) => (
                  <div key={image.id} className="border p-4 rounded">
                    <p className="mb-2 text-sm text-gray-500">ID: {image.id}</p>
                    <p className="mb-2 text-sm text-gray-500">URL: {image.url}</p>
                    <div className="aspect-w-16 aspect-h-9 relative bg-gray-100">
                      {/* Usando img padrão em vez do componente Image do Next.js */}
                      <img 
                        src={image.url} 
                        alt={image.alt || 'Imagem da notícia'} 
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          console.error(`Erro ao carregar imagem ${image.id}:`, e)
                          e.currentTarget.src = '/placeholder-image.jpg'
                          e.currentTarget.alt = 'Imagem não disponível'
                        }}
                      />
                    </div>
                    <div className="mt-2">
                      <a 
                        href={image.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 text-sm hover:underline"
                      >
                        Abrir imagem em nova aba
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
