'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'

// Schema para validação
const formSchema = z.object({
  modalityId: z.string().min(1, 'Selecione uma modalidade'),
  categoryIds: z.array(z.string()).min(1, 'Selecione pelo menos uma categoria'),
  genderIds: z.array(z.string()).min(1, 'Selecione pelo menos um gênero'),
  active: z.boolean().default(true)
})

type FormValues = z.infer<typeof formSchema>

type Relation = {
  id: string
  modalityId: string
  categoryId: string
  genderId: string
  active: boolean
  EventModality: { id: string, name: string }
  EventCategory: { id: string, name: string }
  Gender: { id: string, name: string }
}

export default function EventConfigPage() {
  const [modalities, setModalities] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [genders, setGenders] = useState<any[]>([])
  const [relations, setRelations] = useState<Relation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedModalityId, setSelectedModalityId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Estados para paginação e filtros
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [filterModalityId, setFilterModalityId] = useState<string>('all')
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all')
  const [filterGenderId, setFilterGenderId] = useState<string>('all')
  const [filterActive, setFilterActive] = useState<string>('all')
  const [filteredRelations, setFilteredRelations] = useState<Relation[]>([])

  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      modalityId: '',
      categoryIds: [],
      genderIds: [],
      active: true
    }
  })

  // Carregar modalidades, categorias e gêneros
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        const [modalitiesRes, gendersRes] = await Promise.all([
          fetch('/api/events/modalities', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          }),
          fetch('/api/events/genders', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          })
        ])

        if (!modalitiesRes.ok || !gendersRes.ok) {
          throw new Error('Erro ao carregar dados')
        }

        const modalitiesJson = await modalitiesRes.json()
        const modalitiesList = Array.isArray(modalitiesJson) ? modalitiesJson : modalitiesJson.data
        setModalities(modalitiesList)
        const gendersJson = await gendersRes.json()
        const gendersList = Array.isArray(gendersJson) ? gendersJson : gendersJson.data
        setGenders(gendersList)
        
        // Carregar relações existentes
        await loadRelations()
      } catch (error) {
        console.error('Erro:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [toast])

  // Carregar categorias quando uma modalidade é selecionada
  useEffect(() => {
    async function loadCategories() {
      if (!selectedModalityId) return
      
      try {
        const res = await fetch(`/api/events/categories?modalityId=${selectedModalityId}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })
        if (!res.ok) throw new Error('Erro ao carregar categorias')
        
        const data = await res.json()
        setCategories(data)
      } catch (error) {
        console.error('Erro:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as categorias',
          variant: 'destructive'
        })
      }
    }

    loadCategories()
  }, [selectedModalityId, toast])

  // Carregar relações existentes
  async function loadRelations() {
    try {
      const res = await fetch('/api/events/modality-category-gender', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!res.ok) throw new Error('Erro ao carregar relações')
      
      const data = await res.json()
      setRelations(data)
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as relações',
        variant: 'destructive'
      })
    }
  }

  // Alternar status ativo
  async function toggleActive(id: string, active: boolean) {
    try {
      const res = await fetch('/api/events/modality-category-gender', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active })
      })

      if (!res.ok) throw new Error('Erro ao atualizar relação')
      
      // Atualizar lista local
      setRelations(prev => 
        prev.map(rel => rel.id === id ? { ...rel, active } : rel)
      )

      toast({
        title: 'Sucesso',
        description: 'Relação atualizada com sucesso'
      })
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a relação',
        variant: 'destructive'
      })
    }
  }

  // Excluir relação
  async function deleteRelation(id: string) {
    try {
      const res = await fetch(`/api/events/modality-category-gender?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!res.ok) throw new Error('Erro ao excluir relação')
      
      // Remover da lista local
      setRelations(prev => prev.filter(rel => rel.id !== id))

      toast({
        title: 'Sucesso',
        description: 'Relação excluída com sucesso'
      })
    } catch (error) {
      console.error('Erro:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a relação',
        variant: 'destructive'
      })
    }
  }

  // Enviar formulário
  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    
    try {
      const { modalityId, categoryIds, genderIds, active } = values;
      const createdRelations: Relation[] = [];
      
      // Para cada categoria selecionada
      for (const categoryId of categoryIds) {
        // Para cada gênero selecionado
        for (const genderId of genderIds) {
          const relationData = {
            modalityId,
            categoryId,
            genderId,
            active
          };
          
          const res = await fetch('/api/events/modality-category-gender', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(relationData)
          });
          
          if (!res.ok) {
            const error = await res.json();
            // Continuar mesmo se uma relação já existir
            if (error.error === 'Relação já existe') {
              console.log(`Relação já existe para categoria ${categoryId} e gênero ${genderId}`);
              continue;
            }
            throw new Error(error.error || 'Erro ao criar relação');
          }
          
          const newRelation = await res.json();
          createdRelations.push(newRelation);
        }
      }
      
      // Adicionar à lista local
      if (createdRelations.length > 0) {
        setRelations(prev => [...prev, ...createdRelations]);
        
        // Recarregar todas as relações para garantir que a lista esteja atualizada
        await loadRelations();
        
        // Resetar formulário
        form.reset();
        
        toast({
          title: 'Sucesso',
          description: `${createdRelations.length} relação(ões) criada(s) com sucesso`
        });
      } else {
        toast({
          title: 'Informação',
          description: 'Nenhuma nova relação foi criada. Todas as relações já existem.'
        });
      }
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível criar as relações',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Efeito para filtrar as relações quando os filtros ou as relações mudarem
  useEffect(() => {
    if (relations.length === 0) return;
    
    let filtered = [...relations];
    
    // Aplicar filtros
    if (filterModalityId && filterModalityId !== 'all') {
      filtered = filtered.filter(relation => relation.modalityId === filterModalityId);
    }
    
    if (filterCategoryId && filterCategoryId !== 'all') {
      filtered = filtered.filter(relation => relation.categoryId === filterCategoryId);
    }
    
    if (filterGenderId && filterGenderId !== 'all') {
      filtered = filtered.filter(relation => relation.genderId === filterGenderId);
    }
    
    if (filterActive !== 'all') {
      filtered = filtered.filter(relation => 
        filterActive === 'active' ? relation.active : !relation.active
      );
    }
    
    setFilteredRelations(filtered);
    // Resetar para a primeira página quando os filtros mudam
    setCurrentPage(1);
  }, [relations, filterModalityId, filterCategoryId, filterGenderId, filterActive]);

  // Calcular índices para paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRelations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRelations.length / itemsPerPage);

  // Função para mudar de página
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Configurações de Eventos</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário para criar relações */}
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Relação Modalidade-Categoria-Gênero</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="modalityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modalidade</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value)
                            setSelectedModalityId(value)
                            // Resetar categoria quando a modalidade mudar
                            form.setValue('categoryIds', [])
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma modalidade" />
                          </SelectTrigger>
                          <SelectContent position="popper" className="z-[100]">
                            {modalities.map((modality) => (
                              <SelectItem key={modality.id} value={modality.id}>
                                {modality.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categorias</FormLabel>
                      <FormControl>
                        <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                          {categories.length === 0 ? (
                            <div className="text-muted-foreground text-sm py-2">
                              {!selectedModalityId 
                                ? "Selecione uma modalidade primeiro" 
                                : "Nenhuma categoria disponível"}
                            </div>
                          ) : (
                            categories.map((category) => (
                              <div key={category.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`category-${category.id}`}
                                  checked={field.value.includes(category.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value, category.id])
                                    } else {
                                      field.onChange(field.value.filter((id) => id !== category.id))
                                    }
                                  }}
                                />
                                <label 
                                  htmlFor={`category-${category.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  {category.name}
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="genderIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gênero</FormLabel>
                      <FormControl>
                        <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                          {genders.map((gender) => (
                            <div key={gender.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`gender-${gender.id}`}
                                checked={field.value.includes(gender.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, gender.id])
                                  } else {
                                    field.onChange(field.value.filter((id) => id !== gender.id))
                                  }
                                }}
                              />
                              <label 
                                htmlFor={`gender-${gender.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {gender.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Ativo</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    'Adicionar Relação'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Tabela de relações existentes */}
        <Card>
          <CardHeader>
            <CardTitle>Relações Existentes</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Modalidade</label>
                <Select
                  value={filterModalityId}
                  onValueChange={setFilterModalityId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as modalidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as modalidades</SelectItem>
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
                  value={filterCategoryId}
                  onValueChange={setFilterCategoryId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((category) => (
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
                  value={filterGenderId}
                  onValueChange={setFilterGenderId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os gêneros" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os gêneros</SelectItem>
                    {genders.map((gender) => (
                      <SelectItem key={gender.id} value={gender.id}>
                        {gender.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select
                  value={filterActive}
                  onValueChange={setFilterActive}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Contador de resultados */}
            <div className="mb-4 text-sm text-gray-500">
              Exibindo {currentItems.length} de {filteredRelations.length} resultados
              {filteredRelations.length !== relations.length && (
                <Button 
                  variant="link" 
                  className="p-0 h-auto ml-2" 
                  onClick={() => {
                    setFilterModalityId('all');
                    setFilterCategoryId('all');
                    setFilterGenderId('all');
                    setFilterActive('all');
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
            
            {filteredRelations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhuma relação cadastrada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Modalidade</TableHead>
                      <TableHead>Categorias</TableHead>
                      <TableHead>Gênero</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((relation) => (
                      <TableRow key={relation.id}>
                        <TableCell>{relation.EventModality.name}</TableCell>
                        <TableCell>{relation.EventCategory.name}</TableCell>
                        <TableCell>{relation.Gender.name}</TableCell>
                        <TableCell>
                          <Badge variant={relation.active ? "success" : "destructive"}>
                            {relation.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Switch 
                              checked={relation.active} 
                              onCheckedChange={(checked) => toggleActive(relation.id, checked)}
                              aria-label="Alternar status"
                            />
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => deleteRelation(relation.id)}
                              aria-label="Excluir relação"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-500">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="flex space-x-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => paginate(1)}
                      disabled={currentPage === 1}
                    >
                      Primeira
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    {totalPages <= 5 ? (
                      // Se houver 5 páginas ou menos, mostrar todas
                      [...Array(totalPages).keys()].map((pageNumber) => (
                        <Button 
                          key={pageNumber} 
                          variant={currentPage === pageNumber + 1 ? "default" : "outline"} 
                          size="sm" 
                          onClick={() => paginate(pageNumber + 1)}
                        >
                          {pageNumber + 1}
                        </Button>
                      ))
                    ) : (
                      // Se houver mais de 5 páginas, mostrar um subconjunto
                      <>
                        {/* Primeira página */}
                        {currentPage > 3 && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => paginate(1)}
                          >
                            1
                          </Button>
                        )}
                        
                        {/* Elipses se necessário */}
                        {currentPage > 3 && (
                          <span className="px-2 flex items-center">...</span>
                        )}
                        
                        {/* Páginas ao redor da atual */}
                        {[...Array(5).keys()]
                          .map(i => currentPage - 2 + i)
                          .filter(p => p > 0 && p <= totalPages)
                          .map(pageNumber => (
                            <Button 
                              key={pageNumber} 
                              variant={currentPage === pageNumber ? "default" : "outline"} 
                              size="sm" 
                              onClick={() => paginate(pageNumber)}
                            >
                              {pageNumber}
                            </Button>
                          ))
                        }
                        
                        {/* Elipses se necessário */}
                        {currentPage < totalPages - 2 && (
                          <span className="px-2 flex items-center">...</span>
                        )}
                        
                        {/* Última página */}
                        {currentPage < totalPages - 2 && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => paginate(totalPages)}
                          >
                            {totalPages}
                          </Button>
                        )}
                      </>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => paginate(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      Última
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
