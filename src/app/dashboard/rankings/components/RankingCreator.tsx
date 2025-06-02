'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { PlusCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface FilterOption {
  id?: string
  value: string
  label: string
  modalityName?: string
}

interface RankingCreatorProps {
  onCreateSuccess: () => void
}

export function RankingCreator({ onCreateSuccess }: RankingCreatorProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [name, setName] = useState<string>("")
  const [modality, setModality] = useState<string>("")
  const [category, setCategory] = useState<string>("")
  const [gender, setGender] = useState<string>("")
  const [season, setSeason] = useState<string>(new Date().getFullYear().toString())

  // Query para opções de filtro
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

  // Filtra categorias pela modalidade selecionada
  const filteredCategories = filterOptions?.categories.filter(
    c => !modality || c.modalityName === modality
  ) || []

  // Mutation para criar ranking
  const createRankingMutation = useMutation({
    mutationFn: async (data: {
      name: string
      modality: string
      category: string
      gender: string
      season: number
    }) => {
      const response = await fetch('/api/ranking-configurations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar configuração de ranking')
      }

      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Configuração de ranking criada com sucesso"
      })
      
      // Limpa o formulário
      setName("")
      setModality("")
      setCategory("")
      setGender("")
      setSeason(new Date().getFullYear().toString())
      
      // Invalida queries para recarregar dados
      queryClient.invalidateQueries({ queryKey: ['rankings'] })
      queryClient.invalidateQueries({ queryKey: ['rankingConfigurations'] })
      
      // Notifica o componente pai
      onCreateSuccess()
    },
    onError: (error) => {
      // Verifica se é um erro de conflito (409)
      if (error instanceof Error && error.message.includes('Já existe um ranking')) {
        toast({
          title: "Erro",
          description: "Já existe uma configuração de ranking com esses dados",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Erro",
          description: error instanceof Error ? error.message : 'Erro ao criar configuração de ranking',
          variant: "destructive"
        })
      }
    }
  })

  const handleCreateRanking = () => {
    if (!name) {
      toast({
        title: "Erro",
        description: "Por favor, informe o nome do ranking",
        variant: "destructive"
      })
      return
    }

    if (!modality) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma modalidade",
        variant: "destructive"
      })
      return
    }

    if (!category) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma categoria",
        variant: "destructive"
      })
      return
    }

    if (!gender) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um gênero",
        variant: "destructive"
      })
      return
    }

    if (!season || isNaN(parseInt(season))) {
      toast({
        title: "Erro",
        description: "Por favor, informe uma temporada (ano) válida",
        variant: "destructive"
      })
      return
    }

    createRankingMutation.mutate({
      name,
      modality,
      category,
      gender,
      season: parseInt(season)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Criar Ranking</h2>
      </div>

      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label>Nome do Ranking</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Ranking MTB Elite Masculino 2025"
          />
        </div>

        <div className="space-y-2">
          <Label>Modalidade</Label>
          <Select
            value={modality}
            onValueChange={(value) => {
              setModality(value)
              setCategory("") // Limpa categoria ao mudar modalidade
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a modalidade" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions?.modalities.map((option) => (
                <SelectItem key={`modality-${option.value}`} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select
            value={category}
            onValueChange={setCategory}
            disabled={!modality}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((option) => (
                <SelectItem key={`category-${option.id || option.modalityName}-${option.value}`} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Gênero</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o gênero" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions?.genders.map((option) => (
                <SelectItem key={`gender-${option.value}`} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Temporada</Label>
          <Input
            type="number"
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            placeholder="Ex: 2025"
          />
        </div>
      </div>

      <Button 
        onClick={handleCreateRanking}
        disabled={createRankingMutation.isPending}
        className="w-full"
      >
        {createRankingMutation.isPending ? (
          "Criando..."
        ) : (
          <>
            <PlusCircle className="mr-2 h-4 w-4" />
            Criar Ranking
          </>
        )}
      </Button>
    </div>
  )
}
