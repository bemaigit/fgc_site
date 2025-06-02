'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
// Importar apenas os tipos que realmente usamos
import { 
  Athlete,
  ChampionModality, 
  ChampionCategory, 
  ChampionEntry
} from '@/types/championshipTypes'

interface EditChampionEntryDialogProps {
  isOpen: boolean
  onClose: () => void
  championEntry?: ChampionEntry | null
  eventId: string
  onChampionSaved: (savedChampion: ChampionEntry) => void
}

export default function EditChampionEntryDialog({
  isOpen,
  onClose,
  championEntry,
  eventId,
  onChampionSaved,
}: EditChampionEntryDialogProps) {
  const [formData, setFormData] = useState<ChampionEntry>({
    id: '',
    athleteId: '',
    modalityId: '',
    categoryId: '',
    gender: '',
    position: 1,
    city: '',
    team: '',
    eventId: '',
  })
  
  const [loading, setLoading] = useState(false)
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [modalities, setModalities] = useState<ChampionModality[]>([])
  const [categories, setCategories] = useState<ChampionCategory[]>([])
  const [filteredCategories, setFilteredCategories] = useState<ChampionCategory[]>([])
  
  // Carregar dados necessários
  useEffect(() => {
    async function fetchData() {
      try {
        // Carregar atletas
        const athletesResponse = await fetch('/api/athletes')
        if (!athletesResponse.ok) throw new Error('Erro ao carregar atletas')
        const athletesData = await athletesResponse.json()
        setAthletes(athletesData)
        
        // Carregar modalidades
        const modalitiesResponse = await fetch('/api/championships/modalities')
        if (!modalitiesResponse.ok) throw new Error('Erro ao carregar modalidades')
        const modalitiesData = await modalitiesResponse.json()
        setModalities(modalitiesData)
        
        // Carregar categorias
        const categoriesResponse = await fetch('/api/championships/categories')
        if (!categoriesResponse.ok) throw new Error('Erro ao carregar categorias')
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData)
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        toast.error('Erro ao carregar dados necessários. Por favor, recarregue a página.')
      }
    }

    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  // Filtrar categorias quando a modalidade mudar
  useEffect(() => {
    if (formData.modalityId && categories.length > 0) {
      const filtered = categories.filter(
        (category) => category.modalityId === formData.modalityId
      )
      setFilteredCategories(filtered)
      
      // Se a categoria atual não pertence à modalidade selecionada, resetar
      if (
        formData.categoryId &&
        !filtered.some((cat) => cat.id === formData.categoryId)
      ) {
        setFormData((prev) => ({
          ...prev,
          categoryId: '',
        }))
      }
    } else {
      setFilteredCategories([])
    }
  }, [formData.modalityId, categories, formData.categoryId])

  // Carregar dados do campeão para edição
  useEffect(() => {
    if (championEntry) {
      setFormData({
        id: championEntry.id,
        athleteId: championEntry.athleteId,
        modalityId: championEntry.modalityId,
        categoryId: championEntry.categoryId,
        gender: championEntry.gender,
        position: championEntry.position,
        city: championEntry.city,
        team: championEntry.team || '',
        eventId: championEntry.eventId,
      })
    } else {
      // Resetar o formulário para um novo campeão
      setFormData({
        id: uuidv4(),
        athleteId: '',
        modalityId: '',
        categoryId: '',
        gender: 'MALE', // Padrão masculino
        position: 1,
        city: '',
        team: '',
        eventId: eventId,
      })
    }
  }, [championEntry, eventId, isOpen])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target
    
    if (name === 'position') {
      // Garantir que a posição seja um número positivo
      const position = parseInt(value) || 1
      if (position < 1) return
      
      setFormData((prev) => ({
        ...prev,
        [name]: position,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSelectChange = (value: string, name: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      // Validações básicas
      if (
        !formData.athleteId ||
        !formData.modalityId ||
        !formData.categoryId ||
        !formData.gender ||
        !formData.city
      ) {
        toast.error('Por favor, preencha todos os campos obrigatórios')
        return
      }
      
      const endpoint = '/api/championships/entries'
      const method = championEntry ? 'PUT' : 'POST'
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        let errorMessage = 'Erro ao salvar campeão';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          }
        } catch (e) {
          console.error('Erro ao processar resposta de erro:', e);
        }
        throw new Error(errorMessage);
      }
      
      const savedChampion = await response.json()
      console.log('Campeão salvo com sucesso:', savedChampion)
      
      toast.success(`Campeão ${championEntry ? 'atualizado' : 'cadastrado'} com sucesso!`)
      
      // Passar o campeão salvo para a função de callback
      if (onChampionSaved) {
        onChampionSaved(savedChampion)
      }
      
      // Fechar o dialog somente após salvar com sucesso
      onClose()
    } catch (error: unknown) {
      console.error('Erro ao salvar campeão:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar campeão'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {championEntry ? 'Editar' : 'Adicionar'} Campeão
          </DialogTitle>
          <DialogDescription>
            {championEntry
              ? 'Altere os detalhes do campeão selecionado.'
              : 'Registre um novo campeão para o evento selecionado.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="athleteId" className="text-right">
                Atleta
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.athleteId}
                  onValueChange={(value) => handleSelectChange(value, 'athleteId')}
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
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="modalityId" className="text-right">
                Modalidade
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.modalityId}
                  onValueChange={(value) => handleSelectChange(value, 'modalityId')}
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
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categoryId" className="text-right">
                Categoria
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => handleSelectChange(value, 'categoryId')}
                  disabled={!formData.modalityId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      formData.modalityId 
                        ? "Selecione uma categoria" 
                        : "Primeiro selecione uma modalidade"
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
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="gender" className="text-right">
                Gênero
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleSelectChange(value, 'gender')}
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
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="position" className="text-right">
                Posição
              </Label>
              <Input
                id="position"
                name="position"
                type="number"
                min={1}
                value={formData.position}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="city" className="text-right">
                Cidade
              </Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team" className="text-right">
                Equipe
              </Label>
              <Input
                id="team"
                name="team"
                value={formData.team}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
