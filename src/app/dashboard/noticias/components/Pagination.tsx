'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  // Não renderiza paginação se houver apenas uma página
  if (totalPages <= 1) return null

  // Calcula as páginas a serem exibidas
  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 5
    
    if (totalPages <= maxPagesToShow) {
      // Se o total de páginas for menor que o máximo a mostrar, exibe todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Sempre inclui a primeira página
      pages.push(1)
      
      // Calcula o intervalo em torno da página atual
      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)
      
      // Ajusta para mostrar sempre 3 páginas no meio
      if (startPage === 2) endPage = Math.min(totalPages - 1, startPage + 2)
      if (endPage === totalPages - 1) startPage = Math.max(2, endPage - 2)
      
      // Adiciona ellipsis se necessário
      if (startPage > 2) pages.push('...')
      
      // Adiciona as páginas do meio
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
      
      // Adiciona ellipsis se necessário
      if (endPage < totalPages - 1) pages.push('...')
      
      // Sempre inclui a última página
      pages.push(totalPages)
    }
    
    return pages
  }

  return (
    <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0 mt-6">
      <div className="-mt-px flex w-0 flex-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium ${
            currentPage === 1
              ? 'cursor-not-allowed text-gray-300'
              : 'text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          <ChevronLeft className="mr-3 h-5 w-5" aria-hidden="true" />
          Anterior
        </button>
      </div>
      <div className="hidden md:-mt-px md:flex">
        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500"
            >
              ...
            </span>
          ) : (
            <button
              key={`page-${page}`}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              className={`inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium ${
                currentPage === page
                  ? 'border-[#08285d] text-[#08285d]'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {page}
            </button>
          )
        ))}
      </div>
      <div className="-mt-px flex w-0 flex-1 justify-end">
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium ${
            currentPage === totalPages
              ? 'cursor-not-allowed text-gray-300'
              : 'text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          Próxima
          <ChevronRight className="ml-3 h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}
