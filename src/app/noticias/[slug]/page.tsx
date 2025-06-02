'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, ChevronLeft } from 'lucide-react'
import { processNewsImageUrl } from '@/lib/processNewsImageUrl'

interface NewsImage {
  id: string
  url: string
  alt?: string
  order: number
}

interface NewsDetails {
  id: string
  title: string
  content: string
  excerpt: string | null
  coverImage: string | null
  publishedAt: string | null
  User: {
    name: string | null
  }
  newsimage: NewsImage[]
}

export default function NewsDetailPage() {
  const params = useParams()
  const [news, setNews] = useState<NewsDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<Record<string, string>>({})

  useEffect(() => {
    async function fetchNewsDetails() {
      try {
        setIsLoading(true)
        
        console.log('Buscando detalhes da notícia com slug:', params.slug)
        const response = await fetch(`/api/news/${params.slug}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Notícia não encontrada')
          }
          throw new Error('Falha ao carregar notícia')
        }
        
        const data = await response.json()
        console.log('Dados completos da notícia:', JSON.stringify(data, null, 2))
        console.log('Imagens recebidas:', data.newsimage?.length || 0)
        
        // Verificar URLs das imagens
        if (data.newsimage && data.newsimage.length > 0) {
          console.log('Lista de imagens:', JSON.stringify(data.newsimage, null, 2))
          data.newsimage.forEach((img: NewsImage) => {
            console.log(`Imagem ${img.id}:`, {
              url: img.url,
              alt: img.alt,
              order: img.order
            })
          })
        } else {
          console.log('Nenhuma imagem encontrada na notícia')
        }
        
        setNews(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar notícia'
        console.error('Erro detalhado:', err)
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.slug) {
      fetchNewsDetails()
    }
  }, [params.slug])

  // Função para lidar com erros de carregamento de imagem
  const handleImageError = (imageId: string, errorMessage: string) => {
    console.error(`Erro ao carregar imagem ${imageId}:`, errorMessage)
    setImageError(prev => ({
      ...prev,
      [imageId]: 'Erro ao carregar imagem'
    }))
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex-grow">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </div>
    )
  }

  if (error || !news) {
    return (
      <div className="container mx-auto py-12 flex-grow">
        <div className="text-center py-8 text-gray-500">
          {error || 'Notícia não encontrada'}
        </div>
      </div>
    )
  }

  const formattedDate = news.publishedAt 
    ? format(new Date(news.publishedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : ''

  return (
    <div className="container mx-auto py-12 px-4 flex-grow">
      <div className="max-w-4xl mx-auto">
        {/* Botão Voltar */}
        <div className="mb-6">
          <Link 
            href="/noticias" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </Link>
        </div>
        
        {/* Cabeçalho da notícia */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{news.title}</h1>
          <div className="flex items-center text-gray-600 mb-6">
            <span>Publicado em {formattedDate}</span>
            {news.User?.name && (
              <>
                <span className="mx-2">•</span>
                <span>Por {news.User.name}</span>
              </>
            )}
          </div>
        </div>

        {/* Imagem de capa */}
        {news.coverImage && (
          <div className="mb-8 relative rounded-lg overflow-hidden">
            <div className="relative w-full h-0 pb-[56.25%]">
              <Image
                src={processNewsImageUrl(news.coverImage)}
                alt={news.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                priority
                onError={() => handleImageError('cover', 'Erro na imagem de capa')}
              />
            </div>
          </div>
        )}

        {/* Conteúdo da notícia */}
        <div 
          className="prose prose-lg max-w-none mb-10"
          dangerouslySetInnerHTML={{ __html: news.content }}
        />

        {/* Galeria de imagens adicionais */}
        {news.newsimage && news.newsimage.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Galeria de Imagens ({news.newsimage.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {news.newsimage.map((image) => {
                console.log('Renderizando imagem:', image.url);
                return (
                  <div key={image.id} className="relative rounded-lg overflow-hidden">
                    <div className="relative w-full h-0 pb-[75%]">
                      {imageError[image.id] ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm p-2">
                          Erro ao carregar imagem
                        </div>
                      ) : (
                        <Image
                          src={processNewsImageUrl(image.url)}
                          alt={image.alt || news.title}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          onError={() => handleImageError(image.id, `Erro na imagem ${image.id}`)}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
