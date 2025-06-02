'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Loader2, PlusCircle, Pencil, Trash2 } from 'lucide-react'

interface ChampionEntry {
  id: string
  athleteId: string
  modalityId: string
  categoryId: string
  gender: string
  position: number
  city: string
  team?: string
  eventId: string
  Athlete: {
    id: string
    fullName: string
  }
  ChampionModality: {
    id: string
    name: string
  }
  ChampionCategory: {
    id: string
    name: string
  }
}

interface Athlete {
  id: string
  fullName: string
}

interface ChampionModality {
  id: string
  name: string
}

interface ChampionCategory {
  id: string
  name: string
  modalityId: string
}

interface ManageChampionsProps {
  eventId: string
  eventName: string
}

export default function ManageChampions({ eventId, eventName }: ManageChampionsProps) {
  const [loading, setLoading] = useState(true)
  const [fetchingReferenceData, setFetchingReferenceData] = useState(true)
  const [champions, setChampions] = useState<ChampionEntry[]>([])
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [modalities, setModalities] = useState<ChampionModality[]>([])
  const [categories, setCategories] = useState<ChampionCategory[]>([])
  const [filteredCategories, setFilteredCategories] = useState<ChampionCategory[]>([])
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState({
    id: '',
    athleteId: '',
    modalityId: '',
    categoryId: '',
    gender: '',
    position: 1,
    city: '',
    team: '',
    eventId: eventId
  })
  
  // Carregar campeões do evento
  useEffect(() => {
    const fetchChampions = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/championships/champions?eventId=${eventId}`)
        if (!response.ok) {
          throw new Error('Erro ao carregar campeões')
        }
        const data = await response.json()
        setChampions(data)
      } catch (error) {
        console.error('Erro ao carregar campeões:', error)
        toast.error('Erro ao carregar campeões')
      } finally {
        setLoading(false)
      }
    }

    fetchChampions()
  }, [eventId])
  
  // Carregar atletas, modalidades e categorias
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        setFetchingReferenceData(true)
        
        // Carregar atletas
        const athletesResponse = await fetch('/api/athletes')
        if (!athletesResponse.ok) {
          throw new Error('Erro ao carregar atletas')
        }
        const athletesData = await athletesResponse.json()
        console.log('Dados de atletas:', athletesData)
        
        if (Array.isArray(athletesData)) {
          setAthletes(athletesData.map((athlete: any) => ({
            id: athlete.id,
            fullName: athlete.fullName
          })))
        } else {
          console.error('Formato de dados de atletas inválido:', athletesData)
          toast.error('Formato de dados de atletas inválido')
        }

        // Carregar modalidades
        const modalitiesResponse = await fetch('/api/champion-modalities')
        if (!modalitiesResponse.ok) {
          throw new Error('Erro ao carregar modalidades')
        }
        const modalitiesData = await modalitiesResponse.json()
        console.log('Dados de modalidades:', modalitiesData)
        
        if (Array.isArray(modalitiesData)) {
          setModalities(modalitiesData)
        } else {
          console.error('Formato de dados de modalidades inválido:', modalitiesData)
          toast.error('Formato de dados de modalidades inválido')
        }

        // Carregar categorias
        const categoriesResponse = await fetch('/api/champion-categories')
        if (!categoriesResponse.ok) {
          throw new Error('Erro ao carregar categorias')
        }
        const categoriesData = await categoriesResponse.json()
        console.log('Dados de categorias:', categoriesData)
        
        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData)
        } else {
          console.error('Formato de dados de categorias inválido:', categoriesData)
          toast.error('Formato de dados de categorias inválido')
        }
      } catch (error) {
        console.error('Erro ao carregar dados de referência:', error)
        toast.error('Erro ao carregar dados de referência. Verifique o console para mais detalhes.')
      } finally {
        setFetchingReferenceData(false)
      }
    }

    fetchReferenceData()
  }, [])
  
  // Atualizar categorias filtradas com base na modalidade selecionada
  useEffect(() => {
    if (formData.modalityId) {
      setFilteredCategories(
        categories.filter(category => category.modalityId === formData.modalityId)
      )
    } else {
      setFilteredCategories([])
    }
  }, [formData.modalityId, categories])
  
  const resetForm = () => {
    setFormData({
      id: '',
      athleteId: '',
      modalityId: '',
      categoryId: '',
      gender: '',
      position: 1,
      city: '',
      team: '',
      eventId: eventId
    })
    setIsEditMode(false)
  }
  
  const handleOpenDialog = (champion?: ChampionEntry) => {
    if (champion) {
      setFormData({
        id: champion.id,
        athleteId: champion.athleteId,
        modalityId: champion.modalityId,
        categoryId: champion.categoryId,
        gender: champion.gender,
        position: champion.position,
        city: champion.city,
        team: champion.team || '',
        eventId: eventId
      })
      setIsEditMode(true)
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'position' ? parseInt(value) : value
    }))
  }
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Reset categoria ao mudar a modalidade
    if (name === 'modalityId') {
      setFormData(prev => ({
        ...prev,
        categoryId: ''
      }))
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      const method = isEditMode ? 'PUT' : 'POST'
      const response = await fetch('/api/championships/champions', {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar campeão')
      }
      
      const newChampion = await response.json()
      
      // Atualizar a lista de campeões
      if (isEditMode) {
        setChampions(prev => prev.map(champ => champ.id === newChampion.id ? newChampion : champ))
        toast.success('Campeão atualizado com sucesso')
      } else {
        setChampions(prev => [...prev, newChampion])
        toast.success('Campeão adicionado com sucesso')
      }
      
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Erro ao salvar campeão:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar campeão')
    } finally {
      setLoading(false)
    }
  }
  
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este campeão?')) {
      return
    }
    
    try {
      setLoading(true)
      
      const response = await fetch(`/api/championships/champions?id=${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Erro ao excluir campeão')
      }
      
      // Remover da lista
      setChampions(prev => prev.filter(champ => champ.id !== id))
      toast.success('Campeão excluído com sucesso')
    } catch (error) {
      console.error('Erro ao excluir campeão:', error)
      toast.error('Erro ao excluir campeão')
    } finally {
      setLoading(false)
    }
  }
  
  // Agrupar campeões por modalidade, categoria e gênero
  const groupedChampions = champions.reduce((acc, champion) => {
    const key = `${champion.ChampionModality.name}-${champion.ChampionCategory.name}-${champion.gender}`
    if (!acc[key]) {
      acc[key] = {
        modality: champion.ChampionModality.name,
        category: champion.ChampionCategory.name,
        gender: champion.gender === 'MALE' ? 'Masculino' : 'Feminino',
        entries: []
      }
    }
    acc[key].entries.push(champion)
    return acc
  }, {} as Record<string, { modality: string, category: string, gender: string, entries: ChampionEntry[] }>)
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          Gerenciar Campeões para: {eventName}
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} disabled={loading}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Campeão
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? 'Editar Campeão' : 'Adicionar Novo Campeão'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modalityId">Modalidade:</Label>
                <Select
                  value={formData.modalityId}
                  onValueChange={(value) => handleSelectChange('modalityId', value)}
                  required
                  disabled={fetchingReferenceData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      fetchingReferenceData 
                        ? "Carregando modalidades..." 
                        : modalities.length === 0 
                          ? "Nenhuma modalidade disponível" 
                          : "Selecione a modalidade"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {modalities.length === 0 ? (
                      <div className="p-2 text-center text-muted-foreground">
                        {fetchingReferenceData
                          ? "Carregando..."
                          : "Nenhuma modalidade disponível"}
                      </div>
                    ) : (
                      modalities.map((modality) => (
                        <SelectItem key={modality.id} value={modality.id}>
                          {modality.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="categoryId">Categoria:</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => handleSelectChange('categoryId', value)}
                  required
                  disabled={!formData.modalityId || fetchingReferenceData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      fetchingReferenceData 
                        ? "Carregando categorias..." 
                        : !formData.modalityId 
                          ? "Selecione uma modalidade primeiro"
                          : filteredCategories.length === 0
                            ? "Nenhuma categoria disponível para esta modalidade"
                            : "Selecione a categoria"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {!formData.modalityId ? (
                      <div className="p-2 text-center text-muted-foreground">
                        Selecione uma modalidade primeiro
                      </div>
                    ) : filteredCategories.length === 0 ? (
                      <div className="p-2 text-center text-muted-foreground">
                        {fetchingReferenceData
                          ? "Carregando..."
                          : "Nenhuma categoria disponível para esta modalidade"}
                      </div>
                    ) : (
                      filteredCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gender">Gênero:</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleSelectChange('gender', value)}
                  required
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
                <Label htmlFor="position">Posição:</Label>
                <Input
                  id="position"
                  name="position"
                  type="number"
                  value={formData.position}
                  onChange={handleInputChange}
                  min={1}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="athleteId">Atleta:</Label>
                <Select
                  value={formData.athleteId}
                  onValueChange={(value) => handleSelectChange('athleteId', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o atleta" />
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
                <Label htmlFor="city">Cidade:</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="team">Equipe (opcional):</Label>
                <Input
                  id="team"
                  name="team"
                  value={formData.team}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {loading && champions.length === 0 ? (
        <div className="text-center py-10">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Carregando campeões...</p>
        </div>
      ) : champions.length === 0 ? (
        <div className="text-center py-10 border rounded-md bg-muted/10">
          <p className="text-muted-foreground">
            Nenhum campeão cadastrado para este evento.
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => handleOpenDialog()}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Primeiro Campeão
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.values(groupedChampions).map((group, groupIndex) => (
            <div key={groupIndex} className="border rounded-md overflow-hidden">
              <div className="bg-muted px-4 py-2 font-medium">
                {group.modality} - {group.category} ({group.gender})
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Posição</TableHead>
                    <TableHead>Atleta</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Equipe</TableHead>
                    <TableHead className="w-28 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.entries
                    .sort((a, b) => a.position - b.position)
                    .map((champion) => (
                      <TableRow key={champion.id}>
                        <TableCell>{champion.position}º</TableCell>
                        <TableCell>{champion.Athlete.fullName}</TableCell>
                        <TableCell>{champion.city}</TableCell>
                        <TableCell>{champion.team || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(champion)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(champion.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
