'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const createGallerySchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  modality: z.string().min(1, 'Informe uma modalidade'),
  category: z.string().min(1, 'Informe uma categoria'),
  date: z.string().min(1, 'Selecione uma data'),
})

type CreateGalleryFormData = z.infer<typeof createGallerySchema>

export default function CreateGalleryPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [modalityInputType, setModalityInputType] = useState<'select' | 'custom'>('select')
  const [categoryInputType, setCategoryInputType] = useState<'select' | 'custom'>('select')

  const form = useForm<CreateGalleryFormData>({
    resolver: zodResolver(createGallerySchema),
  })

  async function onSubmit(data: CreateGalleryFormData) {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        // Lidar com diferentes formatos de resposta de erro
        let errorMessage = 'Erro ao criar galeria';
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          // Se o content-type for JSON, tenta fazer o parse
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          // Caso contrário, tenta obter o texto 
          const text = await response.text();
          if (text) {
            errorMessage = text;
          } else {
            errorMessage = `Erro ${response.status}: ${response.statusText}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      const gallery = await response.json()

      toast({
        title: "Galeria criada com sucesso!",
        description: "Agora você pode adicionar imagens à galeria.",
      })

      router.push(`/dashboard/galeria/${gallery.slug}/imagens`)
    } catch (error) {
      console.error('Erro ao criar galeria:', error)
      toast({
        title: "Erro ao criar galeria",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao criar a galeria. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Nova Galeria</h1>
        <p className="text-zinc-500 mt-2">
          Crie uma nova galeria para o evento
        </p>
      </header>

      <Card>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Evento</Label>
            <Input
              id="title"
              placeholder="Digite o título do evento"
              {...form.register('title')}
            />
            {form.formState.errors.title && (
              <span className="text-sm text-red-500">
                {form.formState.errors.title.message}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Digite uma descrição (opcional)"
              {...form.register('description')}
            />
          </div>

          <div className="space-y-2">
            <Label>Modalidade</Label>
            <Tabs value={modalityInputType} onValueChange={(v) => setModalityInputType(v as 'select' | 'custom')} className="w-full">
              <TabsList className="grid grid-cols-2 mb-2">
                <TabsTrigger value="select">Selecionar</TabsTrigger>
                <TabsTrigger value="custom">Personalizada</TabsTrigger>
              </TabsList>
              <TabsContent value="select" className="mt-0">
                <Select 
                  onValueChange={(value) => form.setValue('modality', value)}
                  value={form.watch('modality')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma modalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ciclismo">Ciclismo</SelectItem>
                    <SelectItem value="mtb">Mountain Bike</SelectItem>
                    <SelectItem value="bmx">BMX</SelectItem>
                    <SelectItem value="downhill">Downhill</SelectItem>
                    <SelectItem value="ciclocross">Ciclocross</SelectItem>
                  </SelectContent>
                </Select>
              </TabsContent>
              <TabsContent value="custom" className="mt-0">
                <Input
                  placeholder="Digite uma modalidade personalizada"
                  onChange={(e) => form.setValue('modality', e.target.value)}
                  value={modalityInputType === 'custom' ? form.watch('modality') || '' : ''}
                />
              </TabsContent>
            </Tabs>
            {form.formState.errors.modality && (
              <span className="text-sm text-red-500">
                {form.formState.errors.modality.message}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Tabs value={categoryInputType} onValueChange={(v) => setCategoryInputType(v as 'select' | 'custom')} className="w-full">
              <TabsList className="grid grid-cols-2 mb-2">
                <TabsTrigger value="select">Selecionar</TabsTrigger>
                <TabsTrigger value="custom">Personalizada</TabsTrigger>
              </TabsList>
              <TabsContent value="select" className="mt-0">
                <Select 
                  onValueChange={(value) => form.setValue('category', value)}
                  value={form.watch('category')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elite">Elite</SelectItem>
                    <SelectItem value="sub23">Sub-23</SelectItem>
                    <SelectItem value="master">Master</SelectItem>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="infantil">Infantil</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="amador">Amador</SelectItem>
                    <SelectItem value="turismo">Turismo</SelectItem>
                  </SelectContent>
                </Select>
              </TabsContent>
              <TabsContent value="custom" className="mt-0">
                <Input
                  placeholder="Digite uma categoria personalizada"
                  onChange={(e) => form.setValue('category', e.target.value)}
                  value={categoryInputType === 'custom' ? form.watch('category') || '' : ''}
                />
              </TabsContent>
            </Tabs>
            {form.formState.errors.category && (
              <span className="text-sm text-red-500">
                {form.formState.errors.category.message}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data do Evento</Label>
            <Input
              id="date"
              type="date"
              {...form.register('date')}
            />
            {form.formState.errors.date && (
              <span className="text-sm text-red-500">
                {form.formState.errors.date.message}
              </span>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/galeria')}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Galeria'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
