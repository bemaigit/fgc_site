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
import EditChampionDialog from '@/app/dashboard/champions/components/EditChampionDialog'
import { v4 as uuidv4 } from 'uuid';
import { processUserImageUrl } from '@/lib/processUserImageUrl';

interface Champion {
  id: string
  athleteId: string
  modalityId: string
  categoryId: string
  Athlete: {
    id: string
    fullName: string
    image?: string | null
  }
  ChampionModality: {
    id: string
    name: string
  }
  ChampionCategory: {
    id: string
    name: string
  }
  ChampionshipEvent: {
    id: string
    name: string
    year: number
  }
  gender: string
  position: number
  city: string
  team: string | null
  eventId: string
  createdAt: string
}

interface FilterOption {
  id: string
  name: string
  uniqueKey?: string
}

interface RankingModality {
  id: string
  name: string
}

interface RankingCategory {
  id: string
  name: string
  modality: string
}

export default function CampeoesTable() {
  const [champions, setChampions] = useState<Champion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filtros
  const [modalityFilter, setModalityFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [genderFilter, setGenderFilter] = useState<string>('all')
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear())
  
  // Opções de filtro
  const [modalities, setModalities] = useState<FilterOption[]>([])
  const [categories, setCategories] = useState<FilterOption[]>([])
  const [filteredCategories, setFilteredCategories] = useState<FilterOption[]>([])

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
        const response = await fetch('/api/rankings/modalities-and-categories')
        if (!response.ok) throw new Error('Falha ao carregar filtros')
        
        const data = await response.json()
        
        // Garantir que cada modalidade tenha uma chave única real
        const uniqueModalities = data.modalities.map((m: RankingModality, index: number) => ({ 
          id: m.name, 
          name: m.name,
          uniqueKey: `modality-${m.name}-${m.id || `noId-${index}`}-${uuidv4()}` 
        }));
        
        // Garantir que cada categoria tenha uma chave única real
        const uniqueCategories = data.categories.map((c: RankingCategory, index: number) => ({ 
          id: c.name, 
          name: c.name,
          modality: c.modality,
          uniqueKey: `category-${c.name}-${c.id || `noId-${index}`}-${c.modality || 'noMod'}-${uuidv4()}`
        }));
        
        setModalities(uniqueModalities);
        setCategories(uniqueCategories);
      } catch (err: unknown) {
        console.error('Erro ao carregar opções de filtro:', err)
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError('Não foi possível carregar as opções de filtro')
        toast.error('Erro ao carregar opções', {
          description: errorMessage
        })
      }
    }

    fetchOptions()
  }, [])

  // Filtrar categorias quando a modalidade mudar
  useEffect(() => {
    if (categories.length > 0) {
      if (modalityFilter && modalityFilter !== 'all') {
        // Filtramos por modalidade, mas removemos duplicados usando um Map
        const categoryMap = new Map();
        
        categories
          .filter(cat => cat.id === modalityFilter)
          .forEach(category => {
            const key = `${category.name}-${category.id}`;
            if (!categoryMap.has(key)) {
              categoryMap.set(key, {
                id: category.id,
                name: category.name,
                uniqueKey: category.uniqueKey || `filtered-${uuidv4()}`
              });
            }
          });
        
        setFilteredCategories(Array.from(categoryMap.values()));
      } else {
        setFilteredCategories([]);
      }
    }
  }, [categories, modalityFilter, genderFilter]);

  // Buscar campeões
  useEffect(() => {
    async function fetchChampions() {
      setIsLoading(true)
      setError(null)
      
      try {
        const params = new URLSearchParams()
        if (modalityFilter && modalityFilter !== 'all') params.append('modalityId', modalityFilter)
        if (categoryFilter && categoryFilter !== 'all') params.append('categoryId', categoryFilter)
        if (genderFilter && genderFilter !== 'all') params.append('gender', genderFilter)
        params.append('year', yearFilter.toString())
        
        const response = await fetch(`/api/championships/entries?${params.toString()}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao buscar campeões')
        }
        
        const data = await response.json()
        console.log('Dados recebidos da API:', JSON.stringify(data, null, 2))
        setChampions(data)
      } catch (err: unknown) {
        console.error('Erro ao buscar campeões:', err)
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage)
        toast.error('Erro ao carregar campeões', {
          description: errorMessage
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchChampions()
  }, [modalityFilter, categoryFilter, genderFilter, yearFilter])

  // Função para excluir um campeão
  async function handleDeleteChampion(id: string) {
    if (!confirm('Tem certeza que deseja excluir este campeão?')) return
    
    try {
      const response = await fetch(`/api/championships/entries/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao excluir campeão')
      }
      
      // Atualizar a lista local
      setChampions(champions.filter(champion => champion.id !== id))
      
      toast.success('Campeão excluído com sucesso')
    } catch (err: unknown) {
      console.error('Erro ao excluir campeão:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao excluir campeão', {
        description: errorMessage
      })
    }
  }

  // Função para abrir o dialog de edição
  function handleEditChampion(champion: Champion) {
    // Adaptar o formato do Champion para o formato esperado pelo EditChampionDialog
    const adaptedChampion = {
      id: champion.id,
      athleteId: champion.athleteId,
      modality: champion.ChampionModality?.name || '',
      category: champion.ChampionCategory?.name || '',
      gender: champion.gender,
      position: champion.position,
      city: champion.city,
      team: champion.team,
      year: champion.ChampionshipEvent?.year || new Date().getFullYear(),
      createdAt: champion.createdAt,
      athlete: {
        id: champion.Athlete?.id || '',
        fullName: champion.Athlete?.fullName || '',
        image: champion.Athlete?.image
      }
    }
    
    setEditingChampion(adaptedChampion as any)
    setIsEditDialogOpen(true)
  }

  // Função chamada após edição bem-sucedida
  function handleEditSuccess(updatedChampion: any) {
    // Buscar novamente os campeões para garantir dados atualizados
    setIsLoading(true)
    setError(null)
    
    // Fazer a chamada para a API novamente com os filtros atuais
    fetch(`/api/champions?modality=${modalityFilter}&category=${categoryFilter}&gender=${genderFilter}&year=${yearFilter}`)
      .then(response => {
        if (!response.ok) throw new Error('Falha ao recarregar os campeões')
        return response.json()
      })
      .then(data => {
        setChampions(data.champions || [])
      })
      .catch(err => {
        console.error('Erro ao recarregar campeões:', err)
        setError('Falha ao recarregar dados')
      })
      .finally(() => {
        setIsLoading(false)
      })
    
    // Fechar o dialog
    setIsEditDialogOpen(false)
    setEditingChampion(null)
    
    // Mostrar mensagem de sucesso
    toast.success('Campeão atualizado com sucesso!')
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-medium">Modalidade</label>
          <Select
            value={modalityFilter}
            onValueChange={(value) => {
              setModalityFilter(value);
              setCategoryFilter('all'); // Resetar categoria quando modalidade mudar
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as modalidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="select-all-modalities" value="all">Todas as modalidades</SelectItem>
              {modalities.map((modality) => (
                <SelectItem key={modality.uniqueKey} value={modality.id}>
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
            onValueChange={setCategoryFilter}
            disabled={!modalityFilter || modalityFilter === 'all'}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="select-all-categories" value="all">Todas as categorias</SelectItem>
              {filteredCategories.map((category) => (
                <SelectItem key={category.uniqueKey} value={category.id}>
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
            onValueChange={setGenderFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os gêneros" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="select-all-genders" value="all">Todos os gêneros</SelectItem>
              <SelectItem key="select-male" value="MALE">Masculino</SelectItem>
              <SelectItem key="select-female" value="FEMALE">Feminino</SelectItem>
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
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando campeões...</span>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center py-12 text-red-500">
          <p>{error}</p>
        </div>
      ) : champions.length === 0 ? (
        <div className="flex justify-center items-center py-12 text-gray-500">
          <p>Nenhum campeão encontrado com os filtros selecionados.</p>
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
                <TableHead>Posição</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Equipe</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {champions.map((champion) => (
                <TableRow key={champion.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage 
                          src={champion.Athlete?.image 
                              ? processUserImageUrl(champion.Athlete.image) 
                              : '/images/placeholder-athlete.jpg'
                          } 
                          alt={champion.Athlete?.fullName || 'Atleta'} 
                          onError={(e) => {
                            console.error(`Erro ao carregar imagem do atleta: ${champion.Athlete?.fullName}`)
                            e.currentTarget.src = '/images/placeholder-athlete.jpg'
                          }}
                        />
                        <AvatarFallback>{champion.Athlete?.fullName?.substring(0, 2) || 'AT'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{champion.Athlete?.fullName || 'Carregando...'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{champion.ChampionModality?.name || 'Carregando...'}</TableCell>
                  <TableCell>{champion.ChampionCategory?.name || 'Carregando...'}</TableCell>
                  <TableCell>{champion.gender === 'MALE' ? 'Masculino' : 'Feminino'}</TableCell>
                  <TableCell>{champion.position}º</TableCell>
                  <TableCell>{champion.city}</TableCell>
                  <TableCell>{champion.team || '-'}</TableCell>
                  <TableCell>{champion.ChampionshipEvent?.year}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditChampion(champion)}
                        title="Editar campeão"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteChampion(champion.id)}
                        title="Excluir campeão"
                      >
                        <Trash className="h-4 w-4" />
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
          champion={editingChampion as any /* Corrigido com cast para evitar erros de tipo */}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}
