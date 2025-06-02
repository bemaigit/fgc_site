'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus, Upload, Medal, Database, Filter } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import ModalityDialog from './components/ModalityDialog'
import CategoryDialog from './components/CategoryDialog'
import EditChampionEntryDialog from './components/EditChampionEntryDialog'
import BulkImportDialog from './components/BulkImportDialog'
import CreateChampionForm from '../champions/components/CreateChampionForm'
// Importar tipos compartilhados
import { 
  ChampionshipEvent, 
  ChampionModality, 
  ChampionCategory, 
  ChampionEntry 
} from '@/types/championshipTypes'

export default function CampeoesPage() {
  const router = useRouter()
  // Estados para armazenar dados
  const [events, setEvents] = useState<ChampionshipEvent[]>([])
  const [modalities, setModalities] = useState<ChampionModality[]>([])
  const [categories, setCategories] = useState<ChampionCategory[]>([])
  const [filteredCategories, setFilteredCategories] = useState<ChampionCategory[]>([])
  const [champions, setChampions] = useState<ChampionEntry[]>([])
  const [loading, setLoading] = useState(false)

  // Estados para gerenciar filtros
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [selectedModalityId, setSelectedModalityId] = useState<string>('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [selectedGender, setSelectedGender] = useState<string>('')

  // Estados para controlar exibição de diálogos
  const [showModalityDialog, setShowModalityDialog] = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showChampionDialog, setShowChampionDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [selectedChampion, setSelectedChampion] = useState<ChampionEntry | null>(null)

  // Estados para gerenciar abas
  const [activeTab, setActiveTab] = useState('lista')

  // Carregar dados iniciais
  useEffect(() => {
    fetchEvents()
    fetchModalities()
    fetchCategories()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // Não adicionamos as dependências pois queremos executar apenas uma vez na montagem

  // Filtrar categorias quando a modalidade mudar
  useEffect(() => {
    if (selectedModalityId) {
      const filtered = categories.filter(
        (category) => category.modalityId === selectedModalityId
      )
      setFilteredCategories(filtered)
      
      // Se a categoria atual não pertence à modalidade selecionada, resetar
      if (
        selectedCategoryId &&
        !filtered.some((cat) => cat.id === selectedCategoryId)
      ) {
        setSelectedCategoryId('')
      }
    } else {
      setFilteredCategories([])
      setSelectedCategoryId('')
    }
  }, [selectedModalityId, categories, selectedCategoryId])

  // Buscar campeões quando os filtros mudarem
  useEffect(() => {
    if (selectedEventId) {
      fetchChampions()
    } else {
      setChampions([])
    }
  }, [selectedEventId, selectedModalityId, selectedCategoryId, selectedGender]) // eslint-disable-line react-hooks/exhaustive-deps
  // Não adicionamos fetchChampions pois causaria um loop infinito

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/championships/events')
      if (!response.ok) throw new Error('Erro ao buscar eventos')
      const data = await response.json()
      setEvents(data)
      
      // Selecionar o evento mais recente por padrão se não houver seleção
      if (data.length > 0 && !selectedEventId) {
        setSelectedEventId(data[0].id)
      }
    } catch (error) {
      console.error('Erro ao buscar eventos:', error)
      toast.error('Erro ao carregar eventos. Por favor, tente novamente.')
    }
  }

  const fetchModalities = async () => {
    try {
      const response = await fetch('/api/championships/modalities')
      if (!response.ok) throw new Error('Erro ao buscar modalidades')
      const data = await response.json()
      setModalities(data)
    } catch (error) {
      console.error('Erro ao buscar modalidades:', error)
      toast.error('Erro ao carregar modalidades. Por favor, tente novamente.')
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/championships/categories')
      if (!response.ok) throw new Error('Erro ao buscar categorias')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
      toast.error('Erro ao carregar categorias. Por favor, tente novamente.')
    }
  }

  const fetchChampions = async () => {
    setLoading(true)
    
    try {
      // Construir URL com parâmetros de consulta
      let url = `/api/championships/entries?eventId=${selectedEventId}`
      
      if (selectedModalityId && selectedModalityId !== "_all") {
        url += `&modalityId=${selectedModalityId}`
      }
      
      if (selectedCategoryId && selectedCategoryId !== "_all") {
        url += `&categoryId=${selectedCategoryId}`
      }
      
      if (selectedGender && selectedGender !== "_all") {
        url += `&gender=${selectedGender}`
      }
      
      const response = await fetch(url)
      if (!response.ok) throw new Error('Erro ao buscar campeões')
      const data = await response.json()
      setChampions(data)
    } catch (error) {
      console.error('Erro ao buscar campeões:', error)
      toast.error('Erro ao carregar lista de campeões. Por favor, tente novamente.')
      setChampions([])
    } finally {
      setLoading(false)
    }
  }

  const handleEditChampion = (champion: ChampionEntry) => {
    setSelectedChampion(champion)
    setShowChampionDialog(true)
  }

  const handleDeleteChampion = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este campeão?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/championships/entries?id=${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao excluir campeão')
      }
      
      toast.success('Campeão excluído com sucesso')
      fetchChampions()
    } catch (error: unknown) {
      console.error('Erro ao excluir campeão:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir campeão'
      toast.error(errorMessage)
    }
  }

  const handleAddNewChampion = () => {
    setSelectedChampion(null)
    setShowChampionDialog(true)
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Gerenciamento de Campeões Goianos</h1>
        <p className="text-muted-foreground">
          Adicione, edite e gerencie os campeões goianos por eventos, modalidades, categorias e gênero.
        </p>
      </div>

      <Tabs 
        defaultValue="lista" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="mt-6"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="lista">Lista de Campeões</TabsTrigger>
          <TabsTrigger value="adicionar">Adicionar Campeão</TabsTrigger>
        </TabsList>
        
        <TabsContent value="lista" className="mt-6">
          {/* Área de gestão de eventos, modalidades e categorias */}
          <div className="mb-6 p-4 border rounded-lg bg-muted/30">
            <h2 className="text-lg font-medium mb-2">Configuração</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Gerencie eventos, modalidades e categorias para organizar os campeões.
            </p>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/dashboard/campeoes/eventos')}
              >
                <Database className="mr-2 h-4 w-4" />
                Gerenciar Eventos
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowModalityDialog(true)}
              >
                <Database className="mr-2 h-4 w-4" />
                Gerenciar Modalidades
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowCategoryDialog(true)}
              >
                <Database className="mr-2 h-4 w-4" />
                Gerenciar Categorias
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowImportDialog(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Importar em Massa
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <div className="mb-6 p-4 border rounded-lg">
            <h2 className="text-lg font-medium mb-2 flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Evento</label>
                <Select 
                  value={selectedEventId} 
                  onValueChange={setSelectedEventId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name} ({event.year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Modalidade</label>
                <Select 
                  value={selectedModalityId} 
                  onValueChange={setSelectedModalityId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as modalidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Todas as modalidades</SelectItem>
                    {modalities.map((modality) => (
                      <SelectItem key={modality.id} value={modality.id}>
                        {modality.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Categoria</label>
                <Select 
                  value={selectedCategoryId} 
                  onValueChange={setSelectedCategoryId}
                  disabled={!selectedModalityId || selectedModalityId === "_all"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedModalityId && selectedModalityId !== "_all" ? "Todas as categorias" : "Selecione uma modalidade"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Todas as categorias</SelectItem>
                    {filteredCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Gênero</label>
                <Select 
                  value={selectedGender} 
                  onValueChange={setSelectedGender}
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
            </div>
          </div>

          {/* Lista de campeões */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Campeões</h2>
              <Button onClick={handleAddNewChampion} disabled={!selectedEventId}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Campeão
              </Button>
            </div>

            {!selectedEventId ? (
              <div className="text-center p-6 border rounded-lg">
                <Medal className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">Selecione um Evento</h3>
                <p className="text-muted-foreground">
                  Selecione um evento acima para visualizar os campeões.
                </p>
              </div>
            ) : loading ? (
              <div className="text-center p-6 border rounded-lg">
                <p>Carregando campeões...</p>
              </div>
            ) : champions.length === 0 ? (
              <div className="text-center p-6 border rounded-lg">
                <Medal className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">Nenhum campeão encontrado</h3>
                <p className="text-muted-foreground">
                  Não há campeões registrados para os filtros selecionados.
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Posição
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Atleta
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Modalidade
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoria
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Gênero
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cidade
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Equipe
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {champions.map((champion) => (
                        <tr key={champion.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {champion.position}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <div className="flex items-center">
                              {champion.athleteImage && (
                                <Image
                                  src={champion.athleteImage}
                                  alt={champion.athleteName}
                                  width={40}
                                  height={40}
                                  className="rounded-full mr-2 object-cover"
                                />
                              )}
                              <span>{champion.athleteName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {champion.modalityName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {champion.categoryName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {champion.gender === 'MALE' ? 'Masculino' : 'Feminino'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {champion.city}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {champion.team || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditChampion(champion)}
                              >
                                Editar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteChampion(champion.id)}
                              >
                                Excluir
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="adicionar" className="mt-6">
          <CreateChampionForm 
            onSuccess={() => setActiveTab('lista')} 
          />
        </TabsContent>
      </Tabs>

      {/* Diálogos */}
      
      <ModalityDialog
        isOpen={showModalityDialog}
        onClose={() => setShowModalityDialog(false)}
        onModalitySaved={fetchModalities}
      />
      
      <CategoryDialog
        isOpen={showCategoryDialog}
        onClose={() => setShowCategoryDialog(false)}
        onCategorySaved={fetchCategories}
      />
      
      <EditChampionEntryDialog
        isOpen={showChampionDialog}
        onClose={() => setShowChampionDialog(false)}
        championEntry={selectedChampion}
        eventId={selectedEventId}
        onChampionSaved={fetchChampions}
      />
      
      <BulkImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImportCompleted={fetchChampions}
      />
    </div>
  )
}
