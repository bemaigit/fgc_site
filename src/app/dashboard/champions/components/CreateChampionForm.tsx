'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { v4 as uuidv4 } from 'uuid'

interface Athlete {
  id: string
  fullName: string
  image?: string | null
}

interface FilterOption {
  id: string
  name: string
}

interface CreateChampionFormProps {
  onSuccess: () => void
}

export default function CreateChampionForm({ onSuccess }: CreateChampionFormProps) {
  const currentYear = new Date().getFullYear()
  
  const [formData, setFormData] = useState({
    athleteId: '',
    modality: '',
    category: '',
    gender: 'MALE',
    position: 1,
    city: '',
    team: '',
    year: currentYear
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // States para as opções de select
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [modalities, setModalities] = useState<FilterOption[]>([])
  const [categories, setCategories] = useState<FilterOption[]>([])
  const [filteredCategories, setFilteredCategories] = useState<FilterOption[]>([])
  const [cities, setCities] = useState<string[]>([])
  
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  
  // Anos disponíveis (últimos 5 anos)
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  // Carregar atletas, modalidades, categorias e cidades
  useEffect(() => {
    async function fetchOptions() {
      setIsLoadingOptions(true)
      try {
        // Carregar atletas
        const athletesResp = await fetch('/api/athletes')
        if (!athletesResp.ok) throw new Error('Falha ao carregar atletas')
        const athletesData = await athletesResp.json()
        setAthletes(athletesData.data || [])
        
        // Carregar modalidades e categorias
        const optionsResp = await fetch('/api/rankings/modalities-and-categories')
        if (!optionsResp.ok) throw new Error('Falha ao carregar modalidades e categorias')
        const optionsData = await optionsResp.json()
        
        setModalities(optionsData.modalities.map((m: any) => ({ 
          id: m.name, 
          name: m.name 
        })))
        
        setCategories(optionsData.categories.map((c: any) => ({ 
          id: c.name, 
          name: c.name,
          modality: c.modality
        })))
        
        // Lista de cidades (simplificada para este exemplo)
        // Em um sistema real, poderia vir de uma API de cidades
        setCities([
          'Goiânia', 'São Paulo', 'Rio de Janeiro', 'Belo Horizonte',
          'Curitiba', 'Porto Alegre', 'Brasília', 'Salvador',
          'Anápolis', 'Aparecida de Goiânia'
        ])
      } catch (err) {
        console.error('Erro ao carregar opções:', err)
        setError('Não foi possível carregar as opções do formulário')
      } finally {
        setIsLoadingOptions(false)
      }
    }

    fetchOptions()
  }, [])

  // Filtrar categorias com base na modalidade selecionada
  useEffect(() => {
    if (formData.modality && categories.length > 0) {
      const filtered = categories.filter(
        category => category.modality === formData.modality
      )
      setFilteredCategories(filtered)
      
      // Se a categoria atual não estiver nas categorias filtradas, limpar a seleção
      if (formData.category && !filtered.some(c => c.id === formData.category)) {
        setFormData(prev => ({ ...prev, category: '' }))
      }
    } else {
      setFilteredCategories([])
    }
  }, [formData.modality, categories])

  // Handler para mudanças nos campos do formulário
  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Função para salvar novo campeão
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    // Validação básica
    if (!formData.athleteId || !formData.modality || !formData.category || !formData.city) {
      setError('Preencha todos os campos obrigatórios')
      setIsSubmitting(false)
      return
    }
    
    try {
      const response = await fetch('/api/champions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: uuidv4(), // Gerar ID único para o novo campeão
          ...formData
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar campeão')
      }
      
      toast.success('Campeão adicionado com sucesso')
      
      // Resetar formulário
      setFormData({
        athleteId: '',
        modality: '',
        category: '',
        gender: 'MALE',
        position: 1,
        city: '',
        team: '',
        year: currentYear
      })
      
      // Chamar callback de sucesso
      onSuccess()
      
    } catch (err: any) {
      console.error('Erro ao criar campeão:', err)
      setError(err.message || 'Erro ao salvar. Tente novamente.')
      toast.error('Erro ao adicionar campeão', {
        description: err.message || 'Tente novamente mais tarde'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adicionar Novo Campeão</CardTitle>
        <CardDescription>
          Registre um novo campeão goiano para uma modalidade/categoria específica.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingOptions ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Carregando dados...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Atleta *</label>
              <Select
                value={formData.athleteId}
                onValueChange={(value) => handleChange('athleteId', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um atleta" />
                </SelectTrigger>
                <SelectContent>
                  {athletes.map((athlete) => (
                    <SelectItem key={athlete.id} value={athlete.id}>
                      {athlete.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Modalidade *</label>
              <Select
                value={formData.modality}
                onValueChange={(value) => handleChange('modality', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma modalidade" />
                </SelectTrigger>
                <SelectContent>
                  {modalities.map((modality) => (
                    <SelectItem key={modality.id} value={modality.id}>
                      {modality.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria *</label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange('category', value)}
                disabled={isSubmitting || !formData.modality || filteredCategories.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !formData.modality 
                      ? "Selecione uma modalidade primeiro" 
                      : filteredCategories.length === 0
                        ? "Nenhuma categoria disponível"
                        : "Selecione uma categoria"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Gênero *</label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleChange('gender', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gênero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Masculino</SelectItem>
                  <SelectItem value="FEMALE">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Cidade *</label>
              <Select
                value={formData.city}
                onValueChange={(value) => handleChange('city', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a cidade" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Equipe (opcional)</label>
              <Input
                value={formData.team}
                onChange={(e) => handleChange('team', e.target.value)}
                placeholder="Nome da equipe"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Posição *</label>
              <Input
                type="number"
                min={1}
                value={formData.position}
                onChange={(e) => handleChange('position', parseInt(e.target.value) || 1)}
                placeholder="Posição (1 para campeão)"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">
                Para o Campeão Goiano, normalmente a posição será 1.
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Ano *</label>
              <Select
                value={formData.year.toString()}
                onValueChange={(value) => handleChange('year', parseInt(value))}
                disabled={isSubmitting}
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
            
            {error && (
              <div className="text-sm text-red-500 mt-2">
                {error}
              </div>
            )}
            
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Adicionar Campeão
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
