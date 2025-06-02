'use client'

import { useRankingModalitiesAndCategories } from '@/hooks/useRankingModalitiesAndCategories'
import { Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

import type { RankingFilters } from '@/types/ranking'

interface RankingFiltersProps {
  filters: RankingFilters
  onUpdateFilters: (filters: Partial<RankingFilters>) => void
  gender: 'MALE' | 'FEMALE'
}

export function RankingFilters({ filters, onUpdateFilters, gender }: RankingFiltersProps) {
  const { data, isLoading, error } = useRankingModalitiesAndCategories()
  const [filteredCategories, setFilteredCategories] = useState<Array<{id: string, name: string, uniqueKey: string}>>([])
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  // Filtrar categorias com base na modalidade selecionada
  useEffect(() => {
    if (data?.categories) {
      // Filtra por modalidade e remove duplicados usando Map para garantir IDs únicos
      const categoryMap = new Map();
      
      data.categories
        .filter(category => !filters.modality || category.modality === filters.modality)
        .forEach(category => {
          // Armazena pelo nome da categoria para garantir que não haja repetidos
          // Use a combinação de nome e ID para garantir unicidade
          const key = `${category.name}-${category.id}`;
          if (!categoryMap.has(key)) {
            categoryMap.set(key, {
              id: category.id,
              name: category.name,
              uniqueKey: `${gender}-${filters.modality || 'any'}-${category.id}-${Date.now()}`
            });
          }
        });
      
      setFilteredCategories(Array.from(categoryMap.values()));
    }
  }, [data?.categories, filters.modality, gender])

  // Selecionar a primeira modalidade e categoria quando os dados são carregados
  useEffect(() => {
    if (data?.modalities?.length && !filters.modality) {
      const firstModality = data.modalities[0].name
      onUpdateFilters({ modality: firstModality })
    }
  }, [data?.modalities, filters.modality, onUpdateFilters])

  // Selecionar a primeira categoria quando a modalidade muda
  useEffect(() => {
    if (filteredCategories.length && (!filters.category || !filteredCategories.some(cat => cat.name === filters.category))) {
      onUpdateFilters({ category: filteredCategories[0].name })
    }
  }, [filteredCategories, filters.category, onUpdateFilters])

  const handleFilterChange = (newFilters: Partial<RankingFilters>) => {
    // Se a modalidade mudar, limpar a categoria selecionada
    if (newFilters.modality && newFilters.modality !== filters.modality) {
      onUpdateFilters({ ...newFilters, category: '' })
    } else {
      onUpdateFilters(newFilters)
    }
  }

  if (error) {
    return (
      <div className="bg-red-500/10 text-red-100 p-4 rounded-sm">
        <p className="text-sm">Erro ao carregar opções de filtro</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-white" />
        <span className="ml-2 text-sm text-white/80">
          Carregando filtros...
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
      <select
        className="bg-white/20 text-white border-0 rounded-sm px-3 py-2 text-sm sm:text-base sm:px-4 w-full sm:w-auto mb-2 sm:mb-0"
        value={filters.modality}
        onChange={(e) => handleFilterChange({ modality: e.target.value })}
      >
        <option value="" disabled>Modalidade</option>
        {data?.modalities.map((modality) => (
          <option key={modality.name} value={modality.name}>
            {modality.name}
          </option>
        ))}
      </select>

      <select
        className="bg-white/20 text-white border-0 rounded-sm px-3 py-2 text-sm sm:text-base sm:px-4 w-full sm:w-auto mb-2 sm:mb-0"
        value={filters.category}
        onChange={(e) => handleFilterChange({ category: e.target.value })}
        disabled={!filters.modality || filteredCategories.length === 0}
      >
        <option value="" disabled>Categoria</option>
        {filteredCategories.map((category) => (
          <option key={category.uniqueKey} value={category.name}>
            {category.name}
          </option>
        ))}
      </select>

      <select
        className="bg-white/20 text-white border-0 rounded-sm px-3 py-2 text-sm sm:text-base sm:px-4 w-full sm:w-auto"
        value={filters.season}
        onChange={(e) => handleFilterChange({ season: parseInt(e.target.value) })}
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  )
}
