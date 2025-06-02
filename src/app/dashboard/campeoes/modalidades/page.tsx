'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react'

interface ChampionModality {
  id: string
  name: string
  description?: string
}

interface ChampionCategory {
  id: string
  name: string
  modalityId: string
  description?: string
  ChampionModality?: {
    name: string
  }
}

export default function ModalidadesPage() {
  // Estado para modalidades
  const [loadingModalities, setLoadingModalities] = useState(true)
  const [modalities, setModalities] = useState<ChampionModality[]>([])
  const [isModalityDialogOpen, setIsModalityDialogOpen] = useState(false)
  const [isEditingModality, setIsEditingModality] = useState(false)
  const [modalityForm, setModalityForm] = useState({
    id: '',
    name: '',
    description: ''
  })
  
  // Estado para categorias
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [categories, setCategories] = useState<ChampionCategory[]>([])
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isEditingCategory, setIsEditingCategory] = useState(false)
  const [categoryForm, setCategoryForm] = useState({
    id: '',
    name: '',
    modalityId: '',
    description: ''
  })
  
  // Carregar modalidades e categorias
  useEffect(() => {
    fetchModalities()
    fetchCategories()
  }, [])
  
  // Função para buscar modalidades
  const fetchModalities = async () => {
    try {
      setLoadingModalities(true)
      const response = await fetch('/api/champion-modalities')
      if (!response.ok) {
        throw new Error('Erro ao carregar modalidades')
      }
      const data = await response.json()
      setModalities(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erro ao carregar modalidades:', error)
      toast.error('Erro ao carregar modalidades')
    } finally {
      setLoadingModalities(false)
    }
  }
  
  // Função para buscar categorias
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)
      const response = await fetch('/api/champion-categories')
      if (!response.ok) {
        throw new Error('Erro ao carregar categorias')
      }
      const data = await response.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
      toast.error('Erro ao carregar categorias')
    } finally {
      setLoadingCategories(false)
    }
  }
  
  // Funções para gerenciar modalidades
  const handleOpenModalityDialog = (modality?: ChampionModality) => {
    if (modality) {
      setModalityForm({
        id: modality.id,
        name: modality.name,
        description: modality.description || ''
      })
      setIsEditingModality(true)
    } else {
      setModalityForm({
        id: '',
        name: '',
        description: ''
      })
      setIsEditingModality(false)
    }
    setIsModalityDialogOpen(true)
  }
  
  const handleModalityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setModalityForm((prev) => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSubmitModality = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoadingModalities(true)
      
      const url = '/api/champion-modalities'
      const method = isEditingModality ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modalityForm)
      })
      
      if (!response.ok) {
        throw new Error('Erro ao salvar modalidade')
      }
      
      toast.success(isEditingModality ? 'Modalidade atualizada' : 'Modalidade adicionada')
      setIsModalityDialogOpen(false)
      fetchModalities()
    } catch (error) {
      console.error('Erro ao salvar modalidade:', error)
      toast.error('Erro ao salvar modalidade')
    } finally {
      setLoadingModalities(false)
    }
  }
  
  const handleDeleteModality = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta modalidade? Todas as categorias associadas também serão excluídas.')) {
      return
    }
    
    try {
      setLoadingModalities(true)
      
      const response = await fetch(`/api/champion-modalities?id=${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Erro ao excluir modalidade')
      }
      
      toast.success('Modalidade excluída')
      fetchModalities()
      fetchCategories() // Atualizar categorias também, já que podem ter sido excluídas em cascata
    } catch (error) {
      console.error('Erro ao excluir modalidade:', error)
      toast.error('Erro ao excluir modalidade')
    } finally {
      setLoadingModalities(false)
    }
  }
  
  // Funções para gerenciar categorias
  const handleOpenCategoryDialog = (category?: ChampionCategory) => {
    if (category) {
      setCategoryForm({
        id: category.id,
        name: category.name,
        modalityId: category.modalityId,
        description: category.description || ''
      })
      setIsEditingCategory(true)
    } else {
      setCategoryForm({
        id: '',
        name: '',
        modalityId: modalities.length > 0 ? modalities[0].id : '',
        description: ''
      })
      setIsEditingCategory(false)
    }
    setIsCategoryDialogOpen(true)
  }
  
  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCategoryForm((prev) => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleCategorySelectChange = (name: string, value: string) => {
    setCategoryForm((prev) => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoadingCategories(true)
      
      const url = '/api/champion-categories'
      const method = isEditingCategory ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      })
      
      if (!response.ok) {
        throw new Error('Erro ao salvar categoria')
      }
      
      toast.success(isEditingCategory ? 'Categoria atualizada' : 'Categoria adicionada')
      setIsCategoryDialogOpen(false)
      fetchCategories()
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
      toast.error('Erro ao salvar categoria')
    } finally {
      setLoadingCategories(false)
    }
  }
  
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
      return
    }
    
    try {
      setLoadingCategories(true)
      
      const response = await fetch(`/api/champion-categories?id=${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Erro ao excluir categoria')
      }
      
      toast.success('Categoria excluída')
      fetchCategories()
    } catch (error) {
      console.error('Erro ao excluir categoria:', error)
      toast.error('Erro ao excluir categoria')
    } finally {
      setLoadingCategories(false)
    }
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciar Modalidades e Categorias</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seção de Modalidades */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Modalidades</CardTitle>
                <CardDescription>
                  Gerenciar modalidades de competição para campeões
                </CardDescription>
              </div>
              <Dialog open={isModalityDialogOpen} onOpenChange={setIsModalityDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenModalityDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {isEditingModality ? 'Editar Modalidade' : 'Adicionar Modalidade'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitModality} className="space-y-4 mt-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome:</Label>
                      <Input
                        id="name"
                        name="name"
                        value={modalityForm.name}
                        onChange={handleModalityInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição (opcional):</Label>
                      <Input
                        id="description"
                        name="description"
                        value={modalityForm.description}
                        onChange={handleModalityInputChange}
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsModalityDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={loadingModalities}>
                        {loadingModalities ? (
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
          </CardHeader>
          <CardContent>
            {loadingModalities && modalities.length === 0 ? (
              <div className="text-center py-10">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Carregando modalidades...</p>
              </div>
            ) : modalities.length === 0 ? (
              <div className="text-center py-10 border rounded-md bg-muted/10">
                <p className="text-muted-foreground">
                  Nenhuma modalidade cadastrada.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => handleOpenModalityDialog()}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Primeira Modalidade
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="w-24 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modalities.map((modality) => (
                      <TableRow key={modality.id}>
                        <TableCell className="font-medium">{modality.name}</TableCell>
                        <TableCell>{modality.description || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenModalityDialog(modality)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteModality(modality.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Seção de Categorias */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Categorias</CardTitle>
                <CardDescription>
                  Gerenciar categorias dentro de cada modalidade
                </CardDescription>
              </div>
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => handleOpenCategoryDialog()}
                    disabled={modalities.length === 0}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {isEditingCategory ? 'Editar Categoria' : 'Adicionar Categoria'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitCategory} className="space-y-4 mt-2">
                    <div className="space-y-2">
                      <Label htmlFor="modalityId">Modalidade:</Label>
                      <Select
                        value={categoryForm.modalityId}
                        onValueChange={(value) => handleCategorySelectChange('modalityId', value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a modalidade" />
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
                      <Label htmlFor="name">Nome:</Label>
                      <Input
                        id="name"
                        name="name"
                        value={categoryForm.name}
                        onChange={handleCategoryInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição (opcional):</Label>
                      <Input
                        id="description"
                        name="description"
                        value={categoryForm.description}
                        onChange={handleCategoryInputChange}
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCategoryDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={loadingCategories}>
                        {loadingCategories ? (
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
          </CardHeader>
          <CardContent>
            {loadingCategories && categories.length === 0 ? (
              <div className="text-center py-10">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Carregando categorias...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-10 border rounded-md bg-muted/10">
                <p className="text-muted-foreground">
                  {modalities.length === 0 
                    ? "Adicione modalidades antes de criar categorias" 
                    : "Nenhuma categoria cadastrada"}
                </p>
                {modalities.length > 0 && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => handleOpenCategoryDialog()}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Primeira Categoria
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Modalidade</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="w-24 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>
                          {category.ChampionModality?.name || 
                           modalities.find(m => m.id === category.modalityId)?.name || 
                           'Modalidade não encontrada'}
                        </TableCell>
                        <TableCell>{category.description || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenCategoryDialog(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
