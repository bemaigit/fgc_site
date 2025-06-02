'use client'

import { useState, useEffect } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Pencil, Trash } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import EditChampionDialog from '../components/EditChampionDialog'
import { processUserImageUrl } from '@/lib/processUserImageUrl'

interface Champion {
  id: string
  athleteId: string
  modality: string
  category: string
  gender: string
  position: number
  city: string
  team: string | null
  year: number
  createdAt: string
  athlete: {
    id: string
    fullName: string
    image?: string | null
  }
}

interface FilterOption {
  id: string
  name: string
}

interface RankingModality {
  name: string
}

interface RankingCategory {
  name: string
}

export default function ChampionsTable() {
  const [champions, setChampions] = useState<Champion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filtros
  const [modalityFilter, setModalityFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [genderFilter, setGenderFilter] = useState<string>('')
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear())
  
  // Opções de filtro
  const [modalities, setModalities] = useState<FilterOption[]>([])
  const [categories, setCategories] = useState<FilterOption[]>([])

  // Estado para o modal de edição
  const [editingChampion, setEditingChampion] = useState<Champion | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Anos disponíveis (últimos 5 anos)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  // Buscar modalidades e categorias
  useEffect(() => {
    async function fetchOptions() {
      try {
        // Buscar modalidades
        const modalitiesRes = await fetch('/api/rankings/modalities')
        if (!modalitiesRes.ok) {
          throw new Error('Falha ao carregar modalidades')
        }
        const modalitiesData = await modalitiesRes.json() as RankingModality[]
        setModalities(modalitiesData.map((m) => ({ id: m.name, name: m.name })))
        
        // Buscar categorias
        const categoriesRes = await fetch('/api/rankings/categories')
        if (!categoriesRes.ok) {
          throw new Error('Falha ao carregar categorias')
        }
        const categoriesData = await categoriesRes.json() as RankingCategory[]
        setCategories(categoriesData.map((c) => ({ id: c.name, name: c.name })))
      } catch (error: unknown) {
        console.error('Erro ao carregar dados:', error)
        toast.error(error instanceof Error ? error.message : 'Erro ao carregar opções de filtro')
      }
    }

    fetchOptions()
  }, [])

  // Atualizando as funções que lidam com filtros
  const handleModalityChange = (value: string) => {
    setModalityFilter(value)
    if (value === "_all" || value !== modalityFilter) {
      setCategoryFilter("_all")
    }
  }

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value)
  }

  const handleGenderChange = (value: string) => {
    setGenderFilter(value)
  }

  // Buscar campeões
  const fetchChampions = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Construindo a URL com base nos filtros
      let url = '/api/champions'
      const params: string[] = []
      
      if (modalityFilter && modalityFilter !== "_all") {
        params.push(`modality=${modalityFilter}`)
      }
      
      if (categoryFilter && categoryFilter !== "_all") {
        params.push(`category=${categoryFilter}`)
      }
      
      if (genderFilter && genderFilter !== "_all") {
        params.push(`gender=${genderFilter}`)
      }
      
      params.push(`year=${yearFilter.toString()}`)
      
      if (params.length > 0) {
        url += '?' + params.join('&')
      }
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Erro ao carregar campeões')
      }
      
      const data = await response.json()
      setChampions(data)
    } catch (error: unknown) {
      console.error('Erro ao carregar campeões:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar campeões'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchChampions()
  }, [modalityFilter, categoryFilter, genderFilter, yearFilter]) // eslint-disable-line react-hooks/exhaustive-deps
  // Não adicionamos fetchChampions como dependência para evitar loops infinitos

  // Função para excluir um campeão
  async function handleDeleteChampion(id: string) {
    if (!confirm('Tem certeza que deseja excluir este campeão?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/champions/${id}`, { method: 'DELETE' })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao excluir campeão')
      }
      
      toast.success('Campeão excluído com sucesso')
      fetchChampions()
    } catch (error: unknown) {
      console.error('Erro ao excluir campeão:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir campeão')
    }
  }

  // Função para abrir o dialog de edição
  function handleEditChampion(champion: Champion) {
    setEditingChampion(champion)
    setIsEditDialogOpen(true)
  }

  // Função chamada após edição bem-sucedida
  function handleEditSuccess(updatedChampion: Champion) {
    // Atualizar a lista local com o campeão atualizado
    setChampions(champions.map(c => 
      c.id === updatedChampion.id ? updatedChampion : c
    ))
    
    setIsEditDialogOpen(false)
    toast.success('Campeão atualizado com sucesso')
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-medium">Modalidade</label>
          <Select
            value={modalityFilter}
            onValueChange={handleModalityChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as modalidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todas as modalidades</SelectItem>
              {modalities
                .filter(modality => modality.id && modality.id.trim() !== '')
                .map((modality) => (
                <SelectItem key={modality.id} value={modality.id}>
                  {modality.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium">Categoria</label>
          <Select
            value={categoryFilter}
            onValueChange={handleCategoryChange}
            disabled={!modalityFilter || modalityFilter === "_all"}
          >
            <SelectTrigger>
              <SelectValue placeholder={modalityFilter && modalityFilter !== "_all" ? "Todas as categorias" : "Selecione uma modalidade"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todas as categorias</SelectItem>
              {categories
                .filter(category => category.id && category.id.trim() !== '')
                .map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium">Gênero</label>
          <Select
            value={genderFilter}
            onValueChange={handleGenderChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os gêneros" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos os gêneros</SelectItem>
              <SelectItem value="MALE">Masculino</SelectItem>
              <SelectItem value="FEMALE">Feminino</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium">Ano</label>
          <Select
            value={yearFilter.toString()}
            onValueChange={(value) => setYearFilter(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando campeões...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          {error}
        </div>
      ) : champions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhum campeão encontrado para os filtros selecionados.
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Atleta</TableHead>
                <TableHead>Modalidade</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Gênero</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Equipe</TableHead>
                <TableHead>Posição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {champions.map((champion) => (
                <TableRow key={champion.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage 
                          src={champion.athlete.image 
                              ? processUserImageUrl(champion.athlete.image) 
                              : '/images/placeholder-athlete.jpg'
                          } 
                          alt={champion.athlete.fullName} 
                          onError={(e) => {
                            console.error(`Erro ao carregar imagem do atleta: ${champion.athlete.fullName}`)
                            e.currentTarget.src = '/images/placeholder-athlete.jpg'
                          }}
                        />
                        <AvatarFallback>
                          {champion.athlete.fullName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{champion.athlete.fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{champion.modality}</TableCell>
                  <TableCell>{champion.category}</TableCell>
                  <TableCell>
                    {champion.gender === 'MALE' ? 'Masculino' : 'Feminino'}
                  </TableCell>
                  <TableCell>{champion.city}</TableCell>
                  <TableCell>{champion.team || '-'}</TableCell>
                  <TableCell>{champion.position}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditChampion(champion)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteChampion(champion.id)}
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {editingChampion && (
        <EditChampionDialog
          champion={editingChampion}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}
