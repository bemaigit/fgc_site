'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Filter } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CategoryManager } from './CategoryManager'
import { ModalityManager } from './ModalityManager'
import { RankingUpload } from './RankingUpload'
import { RankingCreator } from './RankingCreator'
import { useToast } from "@/components/ui/use-toast"
import { EditAthleteModal } from './athletes/EditAthleteModal'
import { Athlete } from './athletes/types'
import { useSession } from 'next-auth/react'

interface FilterOption {
  value: string
  label: string
  modalityId?: string
  id?: string
  modalityName?: string
}

interface Filters {
  modality?: string
  category?: string
  gender?: string
}

interface RankingModality {
  id: string
  name: string
  description?: string
  active: boolean
}

interface RankingCategory {
  id: string
  name: string
  description?: string
  modalityId: string
  active: boolean
}

export function RankingManager() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('ranking')
  const [filters, setFilters] = useState<Filters>({})
  const [openFiltersDialog, setOpenFiltersDialog] = useState(false)
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null)
  const [openEditDialog, setOpenEditDialog] = useState(false)

  // Busca opções de filtro
  const { data: filterOptions } = useQuery({
    queryKey: ['rankingFilters'],
    queryFn: async () => {
      const res = await fetch('/api/rankings/filters')
      if (!res.ok) throw new Error('Erro ao buscar opções de filtro')
      return res.json() as Promise<{
        modalities: FilterOption[]
        categories: FilterOption[]
        genders: FilterOption[]
      }>
    }
  })

  // Consulta para buscar categorias
  const categoriesQuery = useQuery({
    queryKey: ['rankingCategories'],
    queryFn: async () => {
      // Usando a API de rankings com um parâmetro para indicar que queremos listar categorias
      const res = await fetch('/api/rankings?type=categories')
      if (!res.ok) {
        throw new Error('Erro ao buscar categorias')
      }
      return res.json()
    },
    enabled: !!session
  })

  // Filtra categorias pela modalidade selecionada
  const filteredCategories = filterOptions?.categories.filter(
    c => !filters.modality || c.modalityName === filters.modality
  ) || []

  // Busca atletas do ranking
  const { data: athletes, isLoading } = useQuery({
    queryKey: ['rankingAthletes', filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (filters.modality) searchParams.append('modality', filters.modality)
      if (filters.category) searchParams.append('category', filters.category)
      if (filters.gender) searchParams.append('gender', filters.gender)

      const res = await fetch(`/api/rankings/athletes?${searchParams.toString()}`)
      if (!res.ok) throw new Error('Erro ao buscar atletas')
      const responseData = await res.json()
      return responseData.data || []
    }
  })

  // Mutations para modalidades
  const addModalityMutation = useMutation({
    mutationFn: async (data: Partial<RankingModality>) => {
      const res = await fetch('/api/rankings/modalities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!res.ok) {
        // Se for erro 409 (Conflict), retorna mensagem específica
        if (res.status === 409) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Já existe uma modalidade com este nome');
        }
        throw new Error('Erro ao adicionar modalidade');
      }
      
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rankingFilters'] })
      toast({
        title: "Sucesso",
        description: "Modalidade adicionada com sucesso"
      })
    }
  })

  const editModalityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RankingModality> }) => {
      const res = await fetch(`/api/rankings/modalities/name/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Erro ao editar modalidade')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rankingFilters'] })
      toast({
        title: "Sucesso",
        description: "Modalidade atualizada com sucesso"
      })
    }
  })

  const deleteModalityMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/rankings/modalities/name/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Erro ao excluir modalidade')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rankingFilters'] })
      toast({
        title: "Sucesso",
        description: "Modalidade excluída com sucesso"
      })
    }
  })

  // Mutations para categorias
  const addCategoryMutation = useMutation({
    mutationFn: async (data: Partial<RankingCategory>) => {
      // Precisamos encontrar o ID real da modalidade baseado no nome
      if (data.modalityId) {
        // Verificando se já é um UUID válido
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidPattern.test(data.modalityId)) {
          // Se não for UUID, busca a modalidade pelo nome
          const modalityObj = filterOptions?.modalities.find(m => m.label === data.modalityId);
          if (modalityObj) {
            console.log(`Convertendo modalidade de "${data.modalityId}" para ID: ${modalityObj.value}`);
            data.modalityId = modalityObj.value;
          } else {
            throw new Error('Modalidade não encontrada');
          }
        }
      }
      
      console.log('Enviando dados para criar categoria:', data);
      
      // Usando o endpoint dedicado para categorias (versão singular)
      const res = await fetch('/api/rankings/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!res.ok) {
        // Se for erro 409 (Conflict), retorna mensagem específica
        if (res.status === 409) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Já existe uma categoria com este nome para esta modalidade');
        }
        throw new Error('Erro ao adicionar categoria');
      }
      
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rankingFilters'] })
      toast({
        title: "Sucesso",
        description: "Categoria adicionada com sucesso"
      })
    }
  })

  const editCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RankingCategory> }) => {
      // Precisamos encontrar o ID real da modalidade baseado no nome
      if (data.modalityId) {
        // Verificando se já é um UUID válido
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidPattern.test(data.modalityId)) {
          // Se não for UUID, busca a modalidade pelo nome
          const modalityObj = filterOptions?.modalities.find(m => m.label === data.modalityId);
          if (modalityObj) {
            console.log(`Convertendo modalidade de "${data.modalityId}" para ID: ${modalityObj.value}`);
            data.modalityId = modalityObj.value;
          } else {
            throw new Error('Modalidade não encontrada');
          }
        }
      }
      
      const res = await fetch(`/api/rankings/category/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Erro ao editar categoria')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rankingFilters'] })
      toast({
        title: "Sucesso",
        description: "Categoria atualizada com sucesso"
      })
    }
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/rankings/category/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Erro ao excluir categoria')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rankingFilters'] })
      toast({
        title: "Sucesso",
        description: "Categoria excluída com sucesso"
      })
    }
  })

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="ranking">Ranking de Atletas</TabsTrigger>
          <TabsTrigger value="upload">Upload de Resultados</TabsTrigger>
          <TabsTrigger value="modalities">Modalidades</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="create">Criar Ranking</TabsTrigger>
        </TabsList>

        <TabsContent value="ranking">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Ranking de Atletas</h2>
            <Button variant="outline" onClick={() => setOpenFiltersDialog(true)}>
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
          </div>

          {isLoading ? (
            <div>Carregando...</div>
          ) : athletes && athletes.length > 0 ? (
            <div className="mt-4">
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Posição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Modalidade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gênero
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cidade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Equipe
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pontos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {athletes.map((athlete: Athlete) => (
                      <tr key={athlete.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {athlete.position}º
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {athlete.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {athlete.modality || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {athlete.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {athlete.gender === 'MALE' ? 'Masculino' : athlete.gender === 'FEMALE' ? 'Feminino' : athlete.gender}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {athlete.city}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {athlete.team || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {athlete.points}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setSelectedAthlete(athlete)
                              setOpenEditDialog(true)
                            }}
                          >
                            Editar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              Nenhum atleta encontrado
              {Object.keys(filters).length > 0 && " com os filtros selecionados"}
            </div>
          )}

          <Dialog open={openFiltersDialog} onOpenChange={setOpenFiltersDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filtrar Ranking</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Modalidade</Label>
                  <Select
                    value={filters.modality}
                    onValueChange={(value) => {
                      setFilters(prev => ({
                        ...prev,
                        modality: value,
                        category: undefined // Limpa categoria ao mudar modalidade
                      }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as modalidades" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions?.modalities.map(m => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) => {
                      setFilters(prev => ({
                        ...prev,
                        category: value
                      }))
                    }}
                    disabled={!filters.modality}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map(c => (
                        <SelectItem key={`${c.id}-${c.value}`} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Gênero</Label>
                  <Select
                    value={filters.gender}
                    onValueChange={(value) => {
                      setFilters(prev => ({
                        ...prev,
                        gender: value
                      }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os gêneros" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions?.genders.map(g => (
                        <SelectItem key={g.value} value={g.value}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({})
                    setOpenFiltersDialog(false)
                  }}
                >
                  Limpar Filtros
                </Button>
                <Button onClick={() => setOpenFiltersDialog(false)}>
                  Aplicar Filtros
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <EditAthleteModal 
            isOpen={openEditDialog} 
            onClose={() => setOpenEditDialog(false)} 
            athlete={selectedAthlete} 
            onSave={() => {
              queryClient.invalidateQueries({ queryKey: ['rankingAthletes'] })
              setOpenEditDialog(false)
            }} 
          />

        </TabsContent>

        <TabsContent value="upload">
          <RankingUpload 
            onUploadSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['rankingAthletes'] })
              toast({
                title: "Sucesso",
                description: "Ranking atualizado com sucesso"
              })
            }}
          />
        </TabsContent>

        <TabsContent value="modalities">
          <ModalityManager
            modalities={filterOptions?.modalities.map(m => ({
              id: m.value,
              name: m.label,
              active: true
            })) || []}
            onAdd={addModalityMutation.mutateAsync}
            onEdit={(id, data) => editModalityMutation.mutateAsync({ id, data })}
            onDelete={deleteModalityMutation.mutateAsync}
          />
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManager
            categories={categoriesQuery.data || []}
            modalities={filterOptions?.modalities.map(m => ({
              id: m.value,
              name: m.label
            })) || []}
            onAdd={(data) => addCategoryMutation.mutateAsync({ ...data, active: true })}
            onEdit={(id, data) => editCategoryMutation.mutateAsync({ id, data: { ...data, active: true } })}
            onDelete={deleteCategoryMutation.mutateAsync}
          />
        </TabsContent>

        <TabsContent value="create">
          <RankingCreator onCreateSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['rankingAthletes'] })
            toast({
              title: "Sucesso",
              description: "Ranking criado com sucesso. Agora você pode fazer upload de resultados para este ranking."
            })
          }} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
