'use client'

import { useEffect, useState } from 'react'
import { useChampionModalitiesAndCategories } from '@/hooks/useChampionModalitiesAndCategories'
import { Loader2 } from 'lucide-react'
import { ChampionFilters } from '@/stores/championFilters'

interface FilterOption {
  id: string
  name: string
  uniqueKey: string
}

interface ChampionsFiltersProps {
  filters: ChampionFilters
  onUpdateFilters: (filters: Partial<ChampionFilters>) => void
  gender: 'MALE' | 'FEMALE'
  years?: number[]
}

export function ChampionsFilters({ filters, onUpdateFilters, gender, years }: ChampionsFiltersProps) {
  const { data, isLoading, error } = useChampionModalitiesAndCategories()
  const [filteredCategories, setFilteredCategories] = useState<FilterOption[]>([])
  
  // Gerar anos para o seletor se não fornecidos
  const currentYear = new Date().getFullYear()
  const yearOptions = years || Array.from({ length: 5 }, (_, i) => currentYear - i)

  // Filtrar categorias com base na modalidade selecionada
  useEffect(() => {
    if (data?.categories) {
      // Usamos um Map para evitar categorias duplicadas
      const categoryMap = new Map();
      
      data.categories
        .filter(category => !filters.modality || category.modality === filters.modality)
        .forEach(category => {
          // Criamos uma chave composta para evitar duplicações
          const key = `${category.name}-${category.id}`;
          if (!categoryMap.has(key)) {
            categoryMap.set(key, {
              id: category.id, 
              name: category.name,
              // Chave única para React com dados suficientes para garantir unicidade
              uniqueKey: `${gender}-${filters.modality || 'any'}-${category.id}-${category.name}`
            });
          }
        });
      
      setFilteredCategories(Array.from(categoryMap.values()));
    }
  }, [data, filters.modality, gender]);

  // Selecionar a primeira modalidade quando os dados são carregados
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

  const handleFilterChange = (newFilters: Partial<ChampionFilters>) => {
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
        className="w-full sm:w-auto bg-white/20 text-white border-0 rounded-sm px-3 sm:px-4 py-2 text-sm sm:text-base focus:ring-2 focus:ring-white/20 focus:outline-none mb-2 sm:mb-0"
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
        className="w-full sm:w-auto bg-white/20 text-white border-0 rounded-sm px-3 sm:px-4 py-2 text-sm sm:text-base focus:ring-2 focus:ring-white/20 focus:outline-none mb-2 sm:mb-0"
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
        className="w-full sm:w-auto bg-white/20 text-white border-0 rounded-sm px-3 sm:px-4 py-2 text-sm sm:text-base focus:ring-2 focus:ring-white/20 focus:outline-none"
        value={filters.year}
        onChange={(e) => handleFilterChange({ year: parseInt(e.target.value) })}
      >
        {yearOptions.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  )
}
