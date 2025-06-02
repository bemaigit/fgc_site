'use client'

import { useEffect, useState } from 'react'
import { useChampionModalitiesAndCategories } from '@/hooks/useChampionModalitiesAndCategories'
import { Loader2 } from 'lucide-react'
import { ChampionFilters } from '../../stores/championFilters'

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
  const { data, isLoading } = useChampionModalitiesAndCategories()
  const [filteredCategories, setFilteredCategories] = useState<FilterOption[]>([])
  const [showModalityDropdown, setShowModalityDropdown] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  
  // Gerar anos para o seletor se não fornecidos
  const currentYear = new Date().getFullYear()
  const yearOptions = years || Array.from({ length: 5 }, (_, i) => currentYear - i)

  useEffect(() => {
    if (data?.categories) {
      const categoryMap = new Map();
      
      data.categories
        .filter(category => !filters.modality || category.modality === filters.modality)
        .forEach(category => {
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
  }, [data, filters.modality, gender]);

  useEffect(() => {
    if (data?.modalities && data.modalities.length > 0 && !filters.modality) {
      onUpdateFilters({ modality: data.modalities[0].name })
    }
  }, [data?.modalities, filters.modality, onUpdateFilters])

  return (
    <div className="flex flex-row space-x-1">
      {/* Filtro de Modalidade */}
      <div className="relative w-[32%]">
        <button 
          className="bg-[#145f23]/90 text-white text-sm px-2 py-2 w-full text-left flex justify-between items-center"
          onClick={() => {
            setShowModalityDropdown(!showModalityDropdown)
            setShowCategoryDropdown(false)
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="truncate">Carregando...</span>
            </span>
          ) : (
            <>
              <span className="truncate">{filters.modality || 'Modalidade'}</span>
              <span>+</span>
            </>
          )}
        </button>
        
        {showModalityDropdown && data?.modalities && data.modalities.length > 0 && (
          <div className="absolute top-full left-0 w-full bg-white shadow-lg z-10 max-h-60 overflow-y-auto">
            {data.modalities.map(modality => (
              <button
                key={modality.name}
                className="w-full text-left px-4 py-2 hover:bg-green-50 transition-colors"
                onClick={() => {
                  onUpdateFilters({ modality: modality.name, category: '' })
                  setShowModalityDropdown(false)
                }}
              >
                {modality.name}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Filtro de Categoria */}
      <div className="relative w-[32%]">
        <button 
          className="bg-[#145f23]/90 text-white text-sm px-2 py-2 w-full text-left flex justify-between items-center"
          onClick={() => {
            setShowCategoryDropdown(!showCategoryDropdown)
            setShowModalityDropdown(false)
          }}
          disabled={!filters.modality || filteredCategories.length === 0}
        >
          {!filters.modality ? (
            <span className="truncate">Selecione modalidade</span>
          ) : filteredCategories.length === 0 ? (
            <span className="truncate">Sem categorias</span>
          ) : (
            <>
              <span className="truncate">{filters.category || 'Categoria'}</span>
              <span>+</span>
            </>
          )}
        </button>
        
        {showCategoryDropdown && filteredCategories.length > 0 && (
          <div className="absolute top-full left-0 w-full bg-white shadow-lg z-10 max-h-60 overflow-y-auto">
            {filteredCategories.map(category => (
              <button
                key={category.uniqueKey}
                className="w-full text-left px-4 py-2 hover:bg-green-50 transition-colors"
                onClick={() => {
                  onUpdateFilters({ category: category.name })
                  setShowCategoryDropdown(false)
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Filtro de Ano */}
      <select
        className="bg-[#145f23]/90 text-white text-sm px-2 py-2 border-0 rounded-none focus:ring-0 focus:outline-none w-[32%]"
        value={filters.year}
        onChange={(e) => onUpdateFilters({ year: parseInt(e.target.value) })}
      >
        {yearOptions.map(year => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  )
}
