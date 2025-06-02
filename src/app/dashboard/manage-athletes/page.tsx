'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { useModalities, useCategories } from '@/hooks'
import { AthletesList } from '@/components/athletes-list'
import { AthleteUpload } from './components/AthleteUpload'
import { AthleteImageManager } from '@/components/athlete/AthleteImageManager'

export default function ManageAthletesPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  
  // Estados para filtros e tabs
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'upload' | 'images'>('list')
  const [filterModalityId, setFilterModalityId] = useState('ALL')
  const [filterCategoryId, setFilterCategoryId] = useState('ALL')
  const [filterGender, setFilterGender] = useState('ALL')
  
  // Estado para o formulário de adição de atleta
  const [name, setName] = useState('')
  const [modalityId, setModalityId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [gender, setGender] = useState('MASCULINO')
  const [city, setCity] = useState('')
  const [team, setTeam] = useState('')
  const [points, setPoints] = useState(0)
  const [position, setPosition] = useState(0)
  const [cpf, setCpf] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [address, setAddress] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [phone, setPhone] = useState('')
  
  // Estados de loading
  const [isAddingAthlete, setIsAddingAthlete] = useState(false)
  
  // Estados para a aba de listagem de atletas
  const [isDeleting, setIsDeleting] = useState(false)
  const [athleteToDelete, setAthleteToDelete] = useState<string | null>(null)
  
  // Hook para buscar modalidades e categorias
  const { modalities } = useModalities()
  const { categories } = useCategories(filterModalityId)
  const { categories: formCategories } = useCategories(modalityId)
  
  // Função para buscar atletas quando os filtros mudarem
  useEffect(() => {
    // Aqui podemos implementar lógica adicional se necessário
    console.log('Filtros atualizados:', { filterModalityId, filterCategoryId, filterGender })
  }, [filterModalityId, filterCategoryId, filterGender])

  // Verifica se o usuário tem permissão para acessar esta página
  if (session?.user.role !== 'ADMIN' && session?.user.role !== 'SUPER_ADMIN') {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta página.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard')}>
              Voltar para o Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Função para excluir um atleta
  const handleDeleteAthlete = async (athleteId: string) => {
    setIsDeleting(true)
    setAthleteToDelete(athleteId)

    try {
      const response = await fetch(`/api/rankings/athletes/${athleteId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Falha ao excluir atleta')
      }

      toast({
        title: 'Atleta excluído com sucesso',
        description: 'O atleta foi removido do sistema.',
        variant: 'default'
      })

      // Recarregar a lista de atletas
      router.refresh()
    } catch (error) {
      console.error('Erro ao excluir atleta:', error)
      toast({
        title: 'Erro ao excluir atleta',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao excluir o atleta.',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
      setAthleteToDelete(null)
    }
  }

  // Função para adicionar um novo atleta
  const handleAddAthlete = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !modalityId || !categoryId || !gender || !city || !cpf || !birthDate || !address || !state || !zipCode || !phone) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive'
      })
      return
    }
    
    setIsAddingAthlete(true)
    
    try {
      const response = await fetch('/api/rankings/athletes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          modalityId,
          categoryId,
          gender,
          city,
          team,
          points,
          position,
          cpf,
          birthDate,
          address,
          state,
          zipCode,
          phone
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao adicionar atleta')
      }
      
      toast({
        title: 'Atleta adicionado com sucesso',
        description: 'O novo atleta foi cadastrado no sistema.',
        variant: 'default'
      })
      
      // Limpa o formulário
      setName('')
      setModalityId('')
      setCategoryId('')
      setGender('MASCULINO')
      setCity('')
      setTeam('')
      setPoints(0)
      setPosition(0)
      setCpf('')
      setBirthDate('')
      setAddress('')
      setState('')
      setZipCode('')
      setPhone('')
      
      // Volta para a aba de listagem
      setActiveTab('list')
      
      // Atualiza a lista de atletas
      router.refresh()
    } catch (error) {
      console.error('Erro ao adicionar atleta:', error)
      toast({
        title: 'Erro ao adicionar atleta',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao adicionar o atleta.',
        variant: 'destructive'
      })
    } finally {
      setIsAddingAthlete(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex space-x-2 mb-4">
        <Button
          variant={activeTab === 'list' ? 'default' : 'outline'}
          onClick={() => setActiveTab('list')}
        >
          Listar Atletas
        </Button>
        <Button
          variant={activeTab === 'add' ? 'default' : 'outline'}
          onClick={() => setActiveTab('add')}
        >
          Adicionar Atleta
        </Button>
        <Button
          variant={activeTab === 'upload' ? 'default' : 'outline'}
          onClick={() => setActiveTab('upload')}
        >
          Upload CSV
        </Button>
        <Button
          variant={activeTab === 'images' ? 'default' : 'outline'}
          onClick={() => setActiveTab('images')}
        >
          Upload Imagens
        </Button>
      </div>
      
      {activeTab === 'list' && (
        <Card>
          <CardHeader>
            <CardTitle>Atletas Cadastrados</CardTitle>
            <CardDescription>
              Lista de atletas cadastrados no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-modality">Filtrar por Modalidade</Label>
                  <Select 
                    value={filterModalityId} 
                    onValueChange={(value) => {
                      setFilterModalityId(value)
                      setFilterCategoryId('ALL')
                    }}
                  >
                    <SelectTrigger id="filter-modality">
                      <SelectValue placeholder="Todas as modalidades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todas as modalidades</SelectItem>
                      {modalities.map((modality) => (
                        <SelectItem key={modality.id} value={modality.id}>
                          {modality.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="filter-category">Filtrar por Categoria</Label>
                  <Select 
                    value={filterCategoryId} 
                    onValueChange={setFilterCategoryId}
                    disabled={!filterModalityId || filterModalityId === 'ALL'}
                  >
                    <SelectTrigger id="filter-category">
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todas as categorias</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="filter-gender">Filtrar por Gênero</Label>
                  <Select 
                    value={filterGender} 
                    onValueChange={setFilterGender}
                  >
                    <SelectTrigger id="filter-gender">
                      <SelectValue placeholder="Todos os gêneros" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos os gêneros</SelectItem>
                      <SelectItem value="MASCULINO">Masculino</SelectItem>
                      <SelectItem value="FEMININO">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <AthletesList
                modalityId={filterModalityId !== 'ALL' ? filterModalityId : undefined}
                categoryId={filterCategoryId !== 'ALL' ? filterCategoryId : undefined}
                gender={filterGender !== 'ALL' ? filterGender : undefined}
                onDelete={handleDeleteAthlete}
                isDeleting={isDeleting}
                athleteToDelete={athleteToDelete}
              />
            </div>
          </CardContent>
        </Card>
      )}
      
      {activeTab === 'add' && (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Novo Atleta</CardTitle>
            <CardDescription>
              Preencha os dados para adicionar um novo atleta ao sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddAthlete} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Atleta</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="modality">Modalidade</Label>
                  <Select 
                    value={modalityId} 
                    onValueChange={setModalityId}
                    required
                  >
                    <SelectTrigger id="modality">
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
                  <Label htmlFor="category">Categoria</Label>
                  <Select 
                    value={categoryId} 
                    onValueChange={setCategoryId}
                    disabled={!modalityId}
                    required
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {formCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gender">Gênero</Label>
                  <Select 
                    value={gender} 
                    onValueChange={setGender}
                    required
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Selecione um gênero" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MASCULINO">Masculino</SelectItem>
                      <SelectItem value="FEMININO">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Cidade do atleta"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="team">Equipe (opcional)</Label>
                  <Input
                    id="team"
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    placeholder="Nome da equipe"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="CPF do atleta"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    placeholder="Data de nascimento do atleta"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Endereço do atleta"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Estado do atleta"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="CEP do atleta"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Telefone do atleta"
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" disabled={isAddingAthlete}>
                {isAddingAthlete ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  'Adicionar Atleta'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload de Atletas via CSV</CardTitle>
            <CardDescription>
              Faça upload de um arquivo CSV contendo dados de múltiplos atletas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AthleteUpload 
              onUploadSuccess={() => {
                toast({
                  title: "Upload concluído",
                  description: "Os atletas foram adicionados com sucesso.",
                })
                setActiveTab('list')
              }} 
            />
          </CardContent>
        </Card>
      )}
      
      {activeTab === 'images' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload de Imagens</CardTitle>
            <CardDescription>
              Faça upload de imagens para os atletas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AthleteImageManager />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
