'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'

interface SearchBarProps {
  onSearch: (term: string) => void
  initialValue?: string
  placeholder?: string
  className?: string
}

export default function SearchBar({
  onSearch,
  initialValue = '',
  placeholder = 'Pesquisar eventos...',
  className = '',
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState(initialValue)
  const [debouncedTerm, setDebouncedTerm] = useState(initialValue)

  // Atualiza o termo de pesquisa quando o valor inicial muda
  useEffect(() => {
    setSearchTerm(initialValue)
    setDebouncedTerm(initialValue)
  }, [initialValue])

  // Debounce para evitar muitas requisições durante a digitação
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Chama a função de pesquisa quando o termo debounced muda
  useEffect(() => {
    onSearch(debouncedTerm)
  }, [debouncedTerm, onSearch])

  return (
    <div className={`flex-1 max-w-md ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#7db0de] focus:border-[#7db0de] sm:text-sm"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => {
              setSearchTerm('')
              setDebouncedTerm('')
            }}
          >
            <span className="h-5 w-5 text-gray-400 hover:text-gray-500">×</span>
          </button>
        )}
      </div>
    </div>
  )
}
