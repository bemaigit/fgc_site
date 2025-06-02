'use client'

import React, { useEffect, useState } from 'react'
import { useEventForm } from '@/contexts/EventFormContext'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FormErrorMessage } from '@/components/ui/form-error-message'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

// Tipos para modalidades, categorias e gêneros
type Modality = {
  id: string;
  name: string;
  description?: string;
  active?: boolean;
};

type Category = {
  id: string;
  name: string;
  modalityIds: string[];
  description?: string;
  active?: boolean;
};

type Gender = {
  id: string;
  name: string;
  code?: string;
  active?: boolean;
};

// Tipo para relação tripla
type ModalityCategoryGender = {
  id: string;
  modalityId: string;
  categoryId: string;
  genderId: string;
  active: boolean;
  EventModality: { id: string, name: string };
  EventCategory: { id: string, name: string };
  Gender: { id: string, name: string };
};

// Interfaces para respostas da API
interface ModalityResponse {
  id: string;
  name: string;
  description?: string;
  active?: boolean;
}

interface CategoryResponse {
  id: string;
  name: string;
  modalityIds: string[];
  description?: string;
  active?: boolean;
}

interface GenderResponse {
  id: string;
  name: string;
  code?: string;
  active?: boolean;
}

export function EventModalityTab() {
  const { formData, updateModality, errors } = useEventForm()
  const { modality } = formData

  // Estados locais
  const [modalities, setModalities] = useState<Modality[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [genders, setGenders] = useState<Gender[]>([])
  const [relations, setRelations] = useState<ModalityCategoryGender[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [searchModality, setSearchModality] = useState('')
  const [searchCategory, setSearchCategory] = useState('')
  const [searchGender, setSearchGender] = useState('')
  const [loading, setLoading] = useState({
    modalities: false,
    categories: false,
    genders: false,
    relations: false
  })

  // Função para buscar modalidades do banco de dados
  const fetchModalities = async () => {
    try {
      setLoading(prev => ({ ...prev, modalities: true }))
      const response = await fetch('/api/events/modalities')
      
      if (!response.ok) {
        throw new Error('Falha ao carregar modalidades')
      }
      
      const responseData = await response.json()
      // Verificar se a resposta contém a propriedade data
      const data = responseData.data || responseData
      
      setModalities(data.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        active: item.active
      })))
    } catch (error) {
      console.error('Erro ao carregar modalidades:', error)
      toast.error('Não foi possível carregar as modalidades')
    } finally {
      setLoading(prev => ({ ...prev, modalities: false }))
    }
  }

  // Função para buscar categorias do banco de dados
  const fetchCategories = async () => {
    try {
      setLoading(prev => ({ ...prev, categories: true }))
      const response = await fetch('/api/events/categories')
      
      if (!response.ok) {
        throw new Error('Falha ao carregar categorias')
      }
      
      const data = await response.json() as CategoryResponse[]
      setCategories(data.map((item) => ({
        id: item.id,
        name: item.name,
        modalityIds: item.modalityIds,
        description: item.description,
        active: item.active
      })))
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
      toast.error('Não foi possível carregar as categorias')
    } finally {
      setLoading(prev => ({ ...prev, categories: false }))
    }
  }

  // Função para buscar gêneros do banco de dados
  const fetchGenders = async () => {
    try {
      setLoading(prev => ({ ...prev, genders: true }))
      const response = await fetch('/api/events/genders')
      
      if (!response.ok) {
        throw new Error('Falha ao carregar gêneros')
      }
      
      const responseData = await response.json()
      // Verificar se a resposta contém a propriedade data
      const data = responseData.data || responseData
      
      setGenders(data.map((item: any) => ({
        id: item.id,
        name: item.name,
        code: item.code,
        active: item.active
      })))
    } catch (error) {
      console.error('Erro ao carregar gêneros:', error)
      toast.error('Não foi possível carregar os gêneros')
    } finally {
      setLoading(prev => ({ ...prev, genders: false }))
    }
  }

  // Função para buscar relações modalidade-categoria-gênero
  const fetchRelations = async () => {
    try {
      setLoading(prev => ({ ...prev, relations: true }))
      const response = await fetch('/api/events/modality-category-gender?active=true')
      
      if (!response.ok) {
        throw new Error('Falha ao carregar relações')
      }
      
      const data = await response.json() as ModalityCategoryGender[]
      setRelations(data)
    } catch (error) {
      console.error('Erro ao carregar relações:', error)
      toast.error('Não foi possível carregar as relações entre modalidades, categorias e gêneros')
    } finally {
      setLoading(prev => ({ ...prev, relations: false }))
    }
  }

  // Carregar dados de modalidades, categorias, gêneros e relações
  useEffect(() => {
    fetchModalities()
    fetchCategories()
    fetchGenders()
    fetchRelations()
  }, [])

  // Filtrar categorias baseado nas modalidades e gêneros selecionados
  useEffect(() => {
    // Se não houver modalidades ou gêneros selecionados, limpar as categorias filtradas
    if (modality.modalityIds.length === 0 || modality.genderIds.length === 0) {
      setFilteredCategories([]);
      return;
    }

    // Função para buscar categorias disponíveis
    const fetchAvailableCategories = async () => {
      try {
        setLoading(prev => ({ ...prev, categories: true }));
        
        // Array para armazenar todas as categorias disponíveis
        let availableCategories: Category[] = [];
        const processedCategoryIds = new Set<string>();
        
        // Para cada combinação de modalidade e gênero
        for (const modalityId of modality.modalityIds) {
          for (const genderId of modality.genderIds) {
            const params = new URLSearchParams();
            params.append('modalityId', modalityId);
            params.append('genderId', genderId);
            params.append('active', 'true');
            
            try {
              const response = await fetch(`/api/events/categories-by-modality-gender?${params}`);
              
              if (!response.ok) {
                console.error(`Erro ao buscar categorias para modalidade ${modalityId} e gênero ${genderId}`);
                continue;
              }
              
              const responseData = await response.json();
              // Verificar se a resposta contém a propriedade data
              const data = responseData.data || responseData;
              
              // Adicionar categorias únicas ao array
              data.forEach((category: any) => {
                if (!processedCategoryIds.has(category.id)) {
                  processedCategoryIds.add(category.id);
                  
                  // Verificar se a categoria pertence a pelo menos uma das modalidades selecionadas
                  const matchingCategory = categories.find(c => c.id === category.id);
                  if (matchingCategory && matchingCategory.modalityIds.some(id => modality.modalityIds.includes(id))) {
                    availableCategories.push(matchingCategory);
                  }
                }
              });
            } catch (error) {
              console.error(`Erro ao buscar categorias para modalidade ${modalityId} e gênero ${genderId}:`, error);
            }
          }
        }
        
        // Atualizar o estado com as categorias disponíveis
        setFilteredCategories(availableCategories);
        
      } catch (error) {
        console.error('Erro ao filtrar categorias:', error);
        toast.error('Erro ao filtrar categorias disponíveis');
      } finally {
        setLoading(prev => ({ ...prev, categories: false }));
      }
    };
    
    // Executar a função de busca
    fetchAvailableCategories();
    
  }, [modality.modalityIds, modality.genderIds, categories]);
  
  // Efeito separado para limpar categorias selecionadas quando não estão mais disponíveis
  useEffect(() => {
    // Se não houver categorias filtradas e existirem categorias selecionadas, limpar seleção
    if (filteredCategories.length === 0 && modality.categoryIds.length > 0) {
      updateModality({ categoryIds: [] });
      return;
    }
    
    // Se houver categorias filtradas e selecionadas, verificar se todas as selecionadas ainda estão disponíveis
    if (filteredCategories.length > 0 && modality.categoryIds.length > 0) {
      const validCategoryIds = modality.categoryIds.filter(
        categoryId => filteredCategories.some(cat => cat.id === categoryId)
      );
      
      // Se alguma categoria selecionada não estiver mais disponível, atualizar seleção
      if (validCategoryIds.length !== modality.categoryIds.length) {
        updateModality({ categoryIds: validCategoryIds });
      }
    }
  }, [filteredCategories, modality.categoryIds]);

  // Filtrar modalidades por pesquisa
  const filteredModalities = modalities.filter(item =>
    item.name.toLowerCase().includes(searchModality.toLowerCase())
  )

  // Filtrar categorias por pesquisa
  const searchedCategories = filteredCategories.filter(item =>
    item.name.toLowerCase().includes(searchCategory.toLowerCase())
  )

  // Filtrar gêneros por pesquisa
  const filteredGenders = genders.filter(item =>
    item.name.toLowerCase().includes(searchGender.toLowerCase())
  )

  // Manipuladores de eventos
  const handleModalityChange = (id: string, checked: boolean) => {
    let newModalityIds = [...modality.modalityIds]
    
    if (checked) {
      newModalityIds.push(id)
    } else {
      newModalityIds = newModalityIds.filter(modalityId => modalityId !== id)
    }
    
    updateModality({ modalityIds: newModalityIds })
  }

  const handleCategoryChange = (id: string, checked: boolean) => {
    let newCategoryIds = [...modality.categoryIds]
    
    if (checked) {
      newCategoryIds.push(id)
    } else {
      newCategoryIds = newCategoryIds.filter(categoryId => categoryId !== id)
    }
    
    updateModality({ categoryIds: newCategoryIds })
  }

  const handleGenderChange = (id: string, checked: boolean) => {
    let newGenderIds = [...modality.genderIds]
    
    if (checked) {
      newGenderIds.push(id)
    } else {
      newGenderIds = newGenderIds.filter(genderId => genderId !== id)
    }
    
    updateModality({ genderIds: newGenderIds })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Modalidades */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Modalidades</Label>
                <Input
                  className="w-40"
                  placeholder="Pesquisar"
                  value={searchModality}
                  onChange={(e) => setSearchModality(e.target.value)}
                />
              </div>
              
              <ScrollArea className="h-64 border rounded-md p-4">
                {loading.modalities ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredModalities.map((item) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`modality-${item.id}`}
                          checked={modality.modalityIds.includes(item.id)}
                          onCheckedChange={(checked) => 
                            handleModalityChange(item.id, checked === true)
                          }
                        />
                        <Label
                          htmlFor={`modality-${item.id}`}
                          className="cursor-pointer"
                        >
                          {item.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              {errors.modalityIds && (
                <FormErrorMessage>{errors.modalityIds[0]}</FormErrorMessage>
              )}
            </div>
            
            {/* Gêneros - Movido para antes das categorias para melhorar o fluxo */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Gêneros</Label>
                <Input
                  className="w-40"
                  placeholder="Pesquisar"
                  value={searchGender}
                  onChange={(e) => setSearchGender(e.target.value)}
                />
              </div>
              
              <ScrollArea className="h-64 border rounded-md p-4">
                {loading.genders ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredGenders.map((item) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`gender-${item.id}`}
                          checked={modality.genderIds.includes(item.id)}
                          onCheckedChange={(checked) => 
                            handleGenderChange(item.id, checked === true)
                          }
                        />
                        <Label
                          htmlFor={`gender-${item.id}`}
                          className="cursor-pointer"
                        >
                          {item.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              {errors.genderIds && (
                <FormErrorMessage>{errors.genderIds[0]}</FormErrorMessage>
              )}
            </div>
            
            {/* Categorias */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Categorias</Label>
                <Input
                  className="w-40"
                  placeholder="Pesquisar"
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                />
              </div>
              
              <ScrollArea className="h-64 border rounded-md p-4">
                {loading.categories || loading.relations ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : modality.modalityIds.length === 0 || modality.genderIds.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-center text-sm text-muted-foreground">
                    Selecione pelo menos uma modalidade e um gênero para ver as categorias disponíveis
                  </div>
                ) : searchedCategories.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-center text-sm text-muted-foreground">
                    Nenhuma categoria disponível para a combinação selecionada
                  </div>
                ) : (
                  <div className="space-y-2">
                    {searchedCategories.map((item) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${item.id}`}
                          checked={modality.categoryIds.includes(item.id)}
                          onCheckedChange={(checked) => 
                            handleCategoryChange(item.id, checked === true)
                          }
                        />
                        <Label
                          htmlFor={`category-${item.id}`}
                          className="cursor-pointer"
                        >
                          {item.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              {errors.categoryIds && (
                <FormErrorMessage>{errors.categoryIds[0]}</FormErrorMessage>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
