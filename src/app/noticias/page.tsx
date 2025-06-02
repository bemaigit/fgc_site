'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2 as LoaderIcon, Search, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { processNewsImageUrl } from '@/lib/processNewsImageUrl'

// Página principal com Suspense boundary
export default function NewsListPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <LoaderIcon className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-2xl font-bold">Carregando notícias...</h2>
          <p className="text-muted-foreground">Aguarde enquanto buscamos as últimas notícias</p>
        </div>
      </div>
    }>
      <NewsListContent />
    </Suspense>
  )
}

// Componente interno que usa hooks client-side

interface News {
  id: string
  title: string
  coverImage: string | null
  excerpt: string | null
  publishedAt: string | null
  slug: string
}

interface NewsApiResponse {
  data: News[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

function NewsListContent() {
  const searchParams = useSearchParams()
  const [news, setNews] = useState<News[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 9,
    total: 0,
    totalPages: 0
  })

  // Obter parâmetros da URL
  const page = searchParams.get('page') ? parseInt(searchParams.get('page') as string) : 1
  const search = searchParams.get('search') || ''

  useEffect(() => {
    // Atualizar o estado de busca quando os parâmetros da URL mudarem
    setSearchTerm(search)
  }, [search])

  useEffect(() => {
    async function fetchNews() {
      try {
        setIsLoading(true)
        
        // Construir URL com parâmetros de paginação e busca
        const queryParams = new URLSearchParams({
          page: page.toString(),
          pageSize: pagination.pageSize.toString(),
          published: 'true'
        })
        
        if (search) {
          queryParams.append('search', search)
        }
        
        const response = await fetch(`/api/news?${queryParams.toString()}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Falha ao carregar notícias')
        }
        
        const data: NewsApiResponse = await response.json()
        
        setNews(data.data)
        setPagination(data.pagination)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar notícias'
        console.error('Erro detalhado:', err)
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNews()
  }, [page, search, pagination.pageSize])

  // Função para lidar com a submissão do formulário de busca
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Atualizar a URL com o termo de busca
    const url = new URL(window.location.href)
    url.searchParams.set('search', searchTerm)
    url.searchParams.set('page', '1') // Voltar para a primeira página ao buscar
    window.history.pushState({}, '', url.toString())
    // Forçar a atualização da página
    window.dispatchEvent(new Event('popstate'))
  }

  // Função para formatar a data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  }

  return (
    <div className="container mx-auto py-12 px-4">
      {/* Botão Voltar */}
      <div className="mb-6">
        <Link 
          href="/" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notícias</h1>
        <p className="text-gray-600 mt-1">Fique por dentro das novidades da federação</p>
      </div>

      {/* Barra de busca */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Buscar notícias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          <Button type="submit" variant="default">
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
        </form>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <LoaderIcon className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-gray-500">
          {error}
        </div>
      ) : !news.length ? (
        <div className="text-center py-8 text-gray-500">
          Nenhuma notícia encontrada
        </div>
      ) : (
        <>
          {/* Grid de notícias */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {news.map((item) => (
              <Link key={item.id} href={`/noticias/${item.slug || item.id}`} className="group">
                <div className="bg-white border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                  {/* Imagem */}
                  <div className="relative aspect-[16/9] overflow-hidden">
                    {item.coverImage ? (
                      <Image
                        src={processNewsImageUrl(item.coverImage)}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        onError={(e) => {
                          console.error(`Erro ao carregar imagem da notícia: ${item.title}`)
                          e.currentTarget.src = '/images/news-placeholder.jpg'
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">Sem imagem</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Conteúdo */}
                  <div className="p-4 flex flex-col flex-grow">
                    {/* Data */}
                    <div className="text-sm text-gray-600 mb-2">
                      Publicado em {formatDate(item.publishedAt)}
                    </div>
                    
                    {/* Título */}
                    <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {item.title}
                    </h2>
                    
                    {/* Resumo */}
                    {item.excerpt && (
                      <p className="text-gray-600 line-clamp-3 mb-4">
                        {item.excerpt}
                      </p>
                    )}
                    
                    {/* Botão */}
                    <div className="mt-auto">
                      <Button 
                        variant="outline" 
                        className="w-full group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors"
                      >
                        Ler mais
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Paginação */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination 
                currentPage={pagination.page} 
                totalPages={pagination.totalPages} 
                onPageChange={(newPage) => {
                  const url = new URL(window.location.href)
                  url.searchParams.set('page', newPage.toString())
                  window.history.pushState({}, '', url.toString())
                  window.dispatchEvent(new Event('popstate'))
                }} 
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
