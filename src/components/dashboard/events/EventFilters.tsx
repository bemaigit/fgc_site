import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { genders } from '@/config/events'
import { FilterX, Loader2 } from 'lucide-react'
import { useEventModalities } from '@/hooks/useEventModalities'
import { useEventCategories } from '@/hooks/useEventCategories'
import { useEffect, useState } from 'react'

interface EventFiltersProps {
  modality: string
  category: string
  gender: string
  eventStatus: string
  onFilterChange: (filter: string, value: string) => void
  onClearFilters: () => void
}

export function EventFilters({
  modality,
  category,
  gender,
  eventStatus,
  onFilterChange,
  onClearFilters,
}: EventFiltersProps) {
  // Estado para armazenar o ID da modalidade
  const [modalityId, setModalityId] = useState<string | undefined>(undefined)
  
  // Busca modalidades
  const { data: modalitiesResponse = { data: [] }, isLoading: isLoadingModalities } = useEventModalities()
  
  // Extrair o array de modalidades da resposta
  const modalities = Array.isArray(modalitiesResponse) 
    ? modalitiesResponse 
    : (modalitiesResponse.data || []);
  
  // Efeito para encontrar o modalityId baseado no nome da modalidade
  useEffect(() => {
    if (modality && modality !== 'all' && modalities.length > 0) {
      const foundModality = modalities.find(m => m.name === modality)
      if (foundModality?.id !== modalityId) {
        setModalityId(foundModality?.id)
      }
    } else if (modalityId !== undefined) {
      setModalityId(undefined)
    }
  }, [modality, modalities, modalityId])
  
  // Busca categorias usando o modalityId calculado via useEffect
  const { data: categories = [], isLoading: isLoadingCategories } = useEventCategories(modalityId)

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Select value={modality || ''} onValueChange={(value) => onFilterChange('modality', value)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Modalidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          {isLoadingModalities ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            modalities
              .filter(m => m.active)
              .map((mod) => (
                <SelectItem key={mod.id} value={mod.name}>{mod.name}</SelectItem>
              ))
          )}
        </SelectContent>
      </Select>

      <Select value={category || ''} onValueChange={(value) => onFilterChange('category', value)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          {isLoadingCategories ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            categories
              .filter((c: any) => c.active)
              .map((cat: any) => (
                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
              ))
          )}
        </SelectContent>
      </Select>

      <Select value={gender || ''} onValueChange={(value) => onFilterChange('gender', value)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Gênero" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {genders.map((gen) => (
            <SelectItem key={gen} value={gen}>{gen}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={eventStatus || ''} onValueChange={(value) => onFilterChange('eventStatus', value)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status do Evento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="upcoming">Próximos</SelectItem>
          <SelectItem value="finished">Finalizados</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" onClick={onClearFilters}>
        <FilterX className="mr-2 h-4 w-4" />
        Limpar Filtros
      </Button>
    </div>
  )
}
