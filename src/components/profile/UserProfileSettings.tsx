'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { processUserImageUrl } from '@/lib/processUserImageUrl'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Loader2, UploadCloud, User, KeyRound, Phone } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { useSession } from 'next-auth/react'

// Schema de validação do formulário
const userProfileSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
  phone: z.string().optional(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine(data => {
  if (data.password && !data.confirmPassword) return false
  if (!data.password && data.confirmPassword) return false
  if (data.password && data.confirmPassword && data.password !== data.confirmPassword) return false
  return true
}, {
  message: "As senhas não conferem",
  path: ["confirmPassword"]
})

type UserProfileFormData = z.infer<typeof userProfileSchema>

interface UserProfileSettingsProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
  athletePhone?: string | null
  onUpdate?: (userData: any) => void
}

export function UserProfileSettings({ user, athletePhone, onUpdate }: UserProfileSettingsProps) {
  const { update } = useSession()
  const [isUploading, setIsUploading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(user.image ? processUserImageUrl(user.image) : null)
  // Usar useRef em vez de useState para a referência do input
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      name: user.name || '',
      phone: athletePhone || '',
      password: '',
      confirmPassword: '',
    }
  })

  // Função para upload de imagem
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validação de tipo e tamanho
    if (!file.type.includes('image/')) {
      toast({
        title: "Formato inválido",
        description: "O arquivo deve ser uma imagem (jpeg, png, etc)",
        variant: "destructive"
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter menos de 5MB",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)

    // Criar preview da imagem
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Preparar para upload
    try {
      // Criar FormData para envio da imagem
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'profile') // Indica que é uma foto de perfil

      // Usar a API de upload existente
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Falha ao fazer upload da imagem')
      }

      const { url, proxyUrl } = await uploadResponse.json()
      
      // Atualizar a imagem no perfil do usuário
      const updateResponse = await fetch('/api/user/update-image', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url }),
      })

      if (!updateResponse.ok) {
        throw new Error('Falha ao atualizar a imagem de perfil')
      }

      const updatedUser = await updateResponse.json()

      // Atualizar a sessão com a nova imagem
      await update({ image: url })
      
      // Atualizar o preview local com a versão processada pelo proxy
      setImagePreview(proxyUrl)

      if (onUpdate) {
        onUpdate(updatedUser)
      }

      toast({
        title: "Imagem atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso",
      })
    } catch (error) {
      console.error('Erro ao atualizar imagem:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar sua foto de perfil",
        variant: "destructive"
      })
      // Reverter preview para a imagem anterior
      setImagePreview(user.image ? processUserImageUrl(user.image) : null)
    } finally {
      setIsUploading(false)
    }
  }

  // Função para salvar alterações no perfil
  const onSubmit = async (data: UserProfileFormData) => {
    setIsUpdating(true)
    try {
      // Atualizar dados básicos do usuário (nome e senha)
      const payload: any = {
        name: data.name
      }

      // Só incluir senha se for fornecida
      if (data.password) {
        payload.password = data.password
      }

      // Primeira requisição: atualizar nome/senha
      const response = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        throw new Error('Falha ao atualizar dados básicos do perfil')
      }
      
      const responseData = await response.json()
      
      // Verificar se há mensagem de aviso (warning) na resposta
      if (responseData.warning) {
        // Exibir aviso mas continuar com a atualização de outros campos
        toast({
          title: "Aviso",
          description: responseData.warning,
          variant: "default"
        })
      }
      
      // O campo de telefone foi movido para o componente ProfileDetails
      // e agora é gerenciado lá, não precisamos mais atualizá-lo aqui
      
      // Já tratamos o erro da primeira requisição acima, não precisamos verificar novamente
      
      let updatedUserData = responseData

      // Atualizar a sessão para refletir as mudanças
      await update({ name: data.name })

      if (onUpdate) {
        onUpdate(updatedUserData)
      }

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso",
      })

      // Limpar campos de senha
      form.setValue('password', '')
      form.setValue('confirmPassword', '')
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar seu perfil",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Função para abrir o seletor de arquivo
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    } else {
      // Fallback se a ref não estiver disponível
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement
        if (target.files && target.files[0]) {
          handleImageChange({ target } as React.ChangeEvent<HTMLInputElement>)
        }
      })
      input.click()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações da Conta</CardTitle>
        <CardDescription>
          Atualize suas informações de acesso ao sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Seção de foto de perfil */}
          <div className="flex flex-col items-center">
            <div 
              className="mb-4 relative cursor-pointer" 
              onClick={triggerFileInput}
            >
              <Avatar className="h-24 w-24 border-2 border-primary/20">
                <AvatarImage src={imagePreview || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {user.name?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="absolute -bottom-2 -right-2 bg-primary text-white p-1.5 rounded-full shadow">
                <UploadCloud className="h-4 w-4" />
              </div>

              {isUploading && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={triggerFileInput}
              disabled={isUploading}
            >
              {isUploading ? 'Enviando...' : 'Alterar foto'}
            </Button>
          </div>

          {/* Formulário de dados pessoais */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de usuário</FormLabel>
                    <FormControl>
                      <div className="flex items-center border rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-primary">
                        <div className="pl-3 pr-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                        </div>
                        <Input 
                          placeholder="Nome para login no sistema" 
                          className="border-0 focus-visible:ring-0" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


                            {/* Campo de telefone foi movido para o componente ProfileDetails 
                 para evitar duplicação de dados */}

              <div className="pt-2 border-t">
                <h3 className="text-sm font-medium mb-3">Segurança</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nova senha</FormLabel>
                        <FormControl>
                          <div className="flex items-center border rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-primary">
                            <div className="pl-3 pr-2 text-muted-foreground">
                              <KeyRound className="h-4 w-4" />
                            </div>
                            <Input 
                              type="password"
                              placeholder="Nova senha (deixe em branco para não alterar)" 
                              className="border-0 focus-visible:ring-0" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar senha</FormLabel>
                        <FormControl>
                          <div className="flex items-center border rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-primary">
                            <div className="pl-3 pr-2 text-muted-foreground">
                              <KeyRound className="h-4 w-4" />
                            </div>
                            <Input 
                              type="password"
                              placeholder="Confirme a nova senha" 
                              className="border-0 focus-visible:ring-0" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </form>
          </Form>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={form.handleSubmit(onSubmit)}
          disabled={isUpdating}
          className="w-full"
        >
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar alterações'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
