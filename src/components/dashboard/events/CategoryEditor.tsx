'use client'

import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EventModality } from '@/hooks/useEventModalities'

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'O nome é obrigatório'),
  description: z.string().min(1, 'A descrição é obrigatória'),
  modalityIds: z.array(z.string()).min(1, 'Selecione pelo menos uma modalidade'),
  active: z.boolean().default(true),
})

type CategoryFormValues = z.infer<typeof formSchema>

interface CategoryEditorProps {
  isOpen: boolean
  category?: {
    id?: string
    name: string
    description: string
    modalityIds: string[]
    active: boolean
  } | null
  modalities: EventModality[]
  isLoading: boolean
  onClose: () => void
  onSubmit: (data: CategoryFormValues) => void
}

export function CategoryEditor({
  isOpen,
  category,
  modalities,
  isLoading,
  onClose,
  onSubmit,
}: CategoryEditorProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: undefined,
      name: '',
      description: '',
      modalityIds: [],
      active: true,
    },
  })

  // Atualiza o formulário quando a categoria mudar
  useEffect(() => {
    if (category) {
      form.reset({
        id: category.id,
        name: category.name,
        description: category.description,
        modalityIds: category.modalityIds,
        active: category.active !== undefined ? category.active : true,
      })
    } else {
      form.reset({
        id: undefined,
        name: '',
        description: '',
        modalityIds: [],
        active: true,
      })
    }
  }, [form, category])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {category?.id ? 'Editar Categoria' : 'Nova Categoria'}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da categoria de evento
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="modalityIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modalidades</FormLabel>
                  <FormDescription>
                    Selecione uma ou mais modalidades para esta categoria
                  </FormDescription>
                  <div className="space-y-2">
                    <ScrollArea className="h-[200px] border rounded-md p-4">
                      {modalities.map((modality) => (
                        <FormField
                          key={modality.id}
                          control={form.control}
                          name="modalityIds"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={modality.id}
                                className="flex flex-row items-start space-x-3 space-y-0 py-1"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(modality.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, modality.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== modality.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {modality.name}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </ScrollArea>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Adulto, Sub-16, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva a categoria" 
                      {...field} 
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Ativa</FormLabel>
                    <FormDescription>
                      Categorias inativas não aparecem para seleção em eventos
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
