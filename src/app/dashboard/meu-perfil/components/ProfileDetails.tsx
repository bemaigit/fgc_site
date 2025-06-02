"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Upload, UserCircle, User2, Bike, Users, Building, MapPin } from 'lucide-react'

interface ProfileDetailsProps {
  user: any
  athlete: any
  onUpdate: (data: any) => void
}

const profileSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  team: z.string().optional(),
  phone: z.string().min(10, { message: 'Telefone inválido' }),
  city: z.string().min(2, { message: 'Cidade é obrigatória' }),
  state: z.string().length(2, { message: 'Estado inválido' }),
  modalities: z.array(z.string()).min(1, 'Selecione pelo menos uma modalidade'),
  category: z.string().min(1, 'Selecione uma categoria')
})

interface Modality {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
  modality: string
  modalityName: string
}

const ProfileDetails = ({ user, athlete, onUpdate }: ProfileDetailsProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [modalities, setModalities] = useState<Modality[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingData, setLoadingData] = useState(true)
  
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      team: athlete?.team || '',
      phone: athlete?.phone || '',
      city: athlete?.city || '',
      state: athlete?.state || '',
      modalities: athlete?.modalities || [],
      category: athlete?.category || ''
    },
  })

  const onSubmit = async (data: z.infer<typeof profileSchema>) => {
    try {
      setIsLoading(true)
      
      // Atualizar dados do usuário
      const response = await fetch('/api/athletes/me/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Falha ao atualizar perfil')
      }
      
      const updatedData = await response.json()
      onUpdate(updatedData)
      toast.success('Perfil atualizado com sucesso')
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      toast.error('Erro ao atualizar perfil. Tente novamente mais tarde.')
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar modalidades e categorias disponíveis
  useEffect(() => {
    const fetchModalitiesAndCategories = async () => {
      try {
        const response = await fetch('/api/modalities-categories')
        if (!response.ok) {
          throw new Error('Erro ao carregar modalidades e categorias')
        }
        const data = await response.json()
        setModalities(data.modalities)
        setCategories(data.categories)
      } catch (error) {
        console.error('Erro ao carregar modalidades e categorias:', error)
        toast.error('Erro ao carregar modalidades e categorias')
      } finally {
        setLoadingData(false)
      }
    }

    fetchModalitiesAndCategories()
  }, [])

  // A função handleImageUpload foi removida pois o componente de upload foi eliminado
  // A funcionalidade de upload é agora exclusivamente gerenciada pelo UserProfileSettings
  
  // Função para extrair iniciais do nome
  const getInitials = (name?: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  // Lista de estados brasileiros
  const states = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados Esportivos</CardTitle>
          <CardDescription>
            Estas informações são usadas em rankings, resultados de eventos e documentos oficiais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
              <TabsTrigger value="athlete">Dados de Atleta</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6 py-4">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={user?.image || ''} alt={user?.name || 'Usuário'} />
                    <AvatarFallback className="text-2xl">
                      {getInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* O componente de upload de avatar foi removido para eliminar a duplicação.
                   * O upload de avatar é gerenciado pelo componente UserProfileSettings
                   * na parte superior da página.
                   */}
                </div>
                
                <div className="flex-1">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                              <Input placeholder="Seu nome completo" {...field} />
                            </FormControl>
                            <FormDescription>
                              Nome que será usado em documentos oficiais e resultados
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="team"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Equipe</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da sua equipe (opcional)" {...field} />
                            </FormControl>
                            <FormDescription>
                              Este nome aparecerá nos rankings e resultados de eventos
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input placeholder="(00) 00000-0000" {...field} />
                            </FormControl>
                            <FormDescription>
                              Telefone para contato em caso de notificações sobre eventos
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="space-y-4">
                        {/* Seletor de Modalidades */}
                        <FormField
                          control={form.control}
                          name="modalities"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Modalidades</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  const currentValues = form.getValues('modalities') || [];
                                  if (!currentValues.includes(value)) {
                                    field.onChange([...currentValues, value]);
                                  }
                                }}
                                value=""
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione as modalidades" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {modalities.map((modality) => (
                                    <SelectItem key={modality.id} value={modality.id}>
                                      {modality.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {field.value?.map((modalityId) => {
                                  const modality = modalities.find(m => m.id === modalityId);
                                  return modality ? (
                                    <div 
                                      key={modalityId}
                                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                                    >
                                      {modality.name}
                                      <button
                                        type="button"
                                        className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary/20 text-primary hover:bg-primary/30"
                                        onClick={() => {
                                          field.onChange(
                                            field.value.filter(id => id !== modalityId)
                                          );
                                        }}
                                      >
                                        <span className="sr-only">Remover</span>
                                        <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
                                          <path d="M8 0.8L7.2 0L4 3.2L0.8 0L0 0.8L3.2 4L0 7.2L0.8 8L4 4.8L7.2 8L8 7.2L4.8 4L8 0.8Z" />
                                        </svg>
                                      </button>
                                    </div>
                                  ) : null;
                                })}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Seletor de Categoria */}
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Categoria</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma categoria" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories
                                    .filter(cat => form.getValues('modalities')?.includes(cat.modality) || !cat.modality)
                                    .map((category) => (
                                      <SelectItem key={category.id} value={category.id}>
                                        {category.name} {category.modalityName ? `(${category.modalityName})` : ''}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cidade</FormLabel>
                              <FormControl>
                                <Input placeholder="Sua cidade" {...field} />
                              </FormControl>
                              <FormDescription>
                                Localização exibida em rankings regionais
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estado</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o estado" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {states.map((state) => (
                                    <SelectItem key={state} value={state}>
                                      {state}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          'Salvar Alterações'
                        )}
                      </Button>
                    </form>
                  </Form>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="athlete" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-md font-medium">Informações Pessoais</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-sm text-muted-foreground">Nome:</span>
                        <span className="ml-2 font-medium">{athlete?.fullName}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm bg-muted px-2 py-0.5 rounded">CPF</span>
                      <div>
                        <span className="text-sm text-muted-foreground">Documento:</span>
                        <span className="ml-2 font-medium">{athlete?.cpf}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Bike className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-sm text-muted-foreground">Modalidades:</span>
                        <div className="ml-2 flex flex-wrap gap-1">
                          {athlete?.modalities?.map((modality: string) => (
                            <span key={modality} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              {modality}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Categoria:</span>
                      <span className="text-xs bg-secondary/80 text-secondary-foreground px-2 py-0.5 rounded-full">
                        {athlete?.category}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-md font-medium">Localização e Contato</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="text-sm text-muted-foreground">Endereço:</span>
                        <div className="font-medium">
                          {athlete?.address}
                          <div className="text-sm text-muted-foreground">
                            {athlete?.city} - {athlete?.state}, {athlete?.zipCode}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-sm text-muted-foreground">Equipe:</span>
                        <span className="ml-2 font-medium">{athlete?.team || 'Não informada'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="text-sm text-muted-foreground">
                <p>Para atualizar dados específicos de atleta como CPF, data de nascimento ou categoria, entre em contato com a administração da FGC.</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfileDetails
