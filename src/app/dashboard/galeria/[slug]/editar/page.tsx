'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'

const editGallerySchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  modality: z.string().min(1, 'Selecione uma modalidade'),
  category: z.string().min(1, 'Selecione uma categoria'),
  date: z.string().min(1, 'Selecione uma data'),
})

type EditGalleryFormData = z.infer<typeof editGallerySchema>

export default function EditGalleryPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<EditGalleryFormData>({
    resolver: zodResolver(editGallerySchema),
  })

  // Carregar dados da galeria
  useEffect(() => {
    async function loadGallery() {
      try {
        const response = await fetch(`/api/gallery/${params.slug}`)
        if (!response.ok) throw new Error('Falha ao carregar galeria')
        
        const gallery = await response.json()
        
        // Formatar a data para o formato YYYY-MM-DD esperado pelo input
        const date = new Date(gallery.date)
        const formattedDate = date.toISOString().split('T')[0]

        form.reset({
          title: gallery.title,
          description: gallery.description || '',
          modality: gallery.modality,
          category: gallery.category,
          date: formattedDate,
        })
      } catch (error) {
        console.error('Erro ao carregar galeria:', error)
        toast({
          title: "Erro ao carregar galeria",
          description: "Não foi possível carregar os dados da galeria.",
          variant: "destructive",
        })
      }
    }

    loadGallery()
  }, [params.slug, form])

  async function onSubmit(data: EditGalleryFormData) {
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/gallery/${params.slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar galeria')
      }

      toast({
        title: "Galeria atualizada com sucesso!",
        description: "As alterações foram salvas.",
      })

      router.push('/dashboard/galeria')
    } catch (error) {
      console.error('Erro ao atualizar galeria:', error)
      toast({
        title: "Erro ao atualizar galeria",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar a galeria. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push('/dashboard/galeria')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para a galeria
        </Button>

        <h1 className="text-2xl font-bold">Editar Galeria</h1>
        <p className="text-zinc-500 mt-2">
          Atualize as informações da galeria
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
            <Label htmlFor="modality">Modalidade</Label>
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
              </SelectContent>
            </Select>
            {form.formState.errors.modality && (
              <span className="text-sm text-red-500">
                {form.formState.errors.modality.message}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
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
              </SelectContent>
            </Select>
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
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
