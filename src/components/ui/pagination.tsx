'use client'

import { Button } from './button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  const visiblePages = pages.filter(page => {
    // Sempre mostrar primeira e última página
    if (page === 1 || page === totalPages) return true

    // Mostrar páginas próximas à atual
    return Math.abs(page - currentPage) <= 1
  })

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {visiblePages.map((page, index) => {
        // Adicionar reticências quando houver lacunas
        if (index > 0 && page - visiblePages[index - 1] > 1) {
          return (
            <span
              key={`ellipsis-${page}`}
              className="px-2 text-zinc-400"
            >
              ...
            </span>
          )
        }

        return (
          <Button
            key={page}
            variant={currentPage === page ? 'default' : 'outline'}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        )
      })}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
