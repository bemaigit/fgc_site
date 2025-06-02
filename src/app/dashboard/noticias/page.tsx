'use client'

import { useState, useEffect, useCallback } from 'react'
import NewsTable, { News } from './components/NewsTable'
import SearchBar from './components/SearchBar'
import ActionButtons from './components/ActionButtons'
import Pagination from './components/Pagination'

export default function NoticiasPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [news, setNews] = useState<News[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 10

  // Função para buscar notícias
  const fetchNews = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/news?page=${currentPage}&pageSize=${pageSize}&search=${searchTerm}`
      )
      const data = await response.json()
      
      // Mapear os dados para o formato esperado pelo componente NewsTable
      const formattedNews = data.data.map((item: {
        id: string;
        title: string;
        published: boolean;
        createdAt: string;
        updatedAt: string;
        publishedAt: string | null;
        coverImage: string | null;
      }) => ({
        id: item.id,
        title: item.title,
        published: item.published,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        publishedAt: item.publishedAt,
        coverImage: item.coverImage
      }))
      
      setNews(formattedNews)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error('Erro ao buscar notícias:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchTerm, pageSize])

  // Buscar notícias quando a página carregar, o termo de busca ou a página mudar
  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  // Função para excluir uma notícia
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/news?id=${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Atualizar a lista de notícias após a exclusão
        fetchNews()
      } else {
        console.error('Erro ao excluir notícia')
      }
    } catch (error) {
      console.error('Erro ao excluir notícia:', error)
    }
  }

  // Função para lidar com a mudança de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Função para lidar com a pesquisa
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1) // Voltar para a primeira página ao pesquisar
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Notícias</h1>
        <ActionButtons />
      </div>

      {/* Barra de pesquisa */}
      <div className="flex items-center space-x-4">
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Tabela de notícias */}
      <NewsTable news={news} onDelete={handleDelete} isLoading={isLoading} />

      {/* Paginação */}
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={handlePageChange} 
      />
    </div>
  )
}
