'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Trash, Pencil } from 'lucide-react'

interface Category {
  id: string
  name: string
  modalityId: string
  ageRange?: {
    min: number
    max: number
  }
}

interface Modality {
  id: string
  name: string
}

export interface CategoryManagerProps {
  categories: Category[]
  modalities: Modality[]
  onAdd: (category: Partial<Category>) => Promise<void>
  onEdit: (id: string, category: Partial<Category>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function CategoryManager({
  categories,
  modalities,
  onAdd,
  onEdit,
  onDelete
}: CategoryManagerProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Partial<Category>>({})

  const handleSave = async () => {
    try {
      if (!form.name?.trim()) {
        throw new Error('Nome é obrigatório')
      }
      if (!form.modalityId) {
        throw new Error('Modalidade é obrigatória')
      }

      if (form.id) {
        await onEdit(form.id, form)
      } else {
        await onAdd(form)
      }
      setOpen(false)
      setForm({})
      toast({
        title: 'Sucesso',
        description: `Categoria ${form.id ? 'atualizada' : 'criada'} com sucesso`
      })
    } catch (error) {
      // Verifica se é um erro de conflito (categoria já existe)
      if (error instanceof Error && error.message.includes('já existe')) {
        toast({
          variant: 'destructive',
          title: 'Categoria já existe',
          description: 'Já existe uma categoria com este nome para esta modalidade.'
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: error instanceof Error ? error.message : 'Erro ao salvar categoria'
        })
      }
    }
  }

  // Confirmação antes de excluir
  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a categoria ${name}?`)) {
      onDelete(id)
    }
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Categorias</h2>
        <Button onClick={() => {
          setForm({})
          setOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-12 px-4 text-left align-middle font-medium">Nome</th>
              <th className="h-12 px-4 text-left align-middle font-medium">Modalidade</th>
              <th className="h-12 px-4 text-left align-middle font-medium">Faixa Etária</th>
              <th className="h-12 px-4 text-right align-middle font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b">
                <td className="p-4">{category.name}</td>
                <td className="p-4">
                  {modalities.find(m => m.id === category.modalityId)?.name}
                </td>
                <td className="p-4">
                  {category.ageRange 
                    ? `${category.ageRange.min} - ${category.ageRange.max} anos`
                    : 'Sem restrição'}
                </td>
                <td className="p-4 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setForm(category)
                      setOpen(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(category.id, category.name)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form.id ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={form.name || ''}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="modality">Modalidade *</Label>
                <Select
                  value={form.modalityId || ""}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, modalityId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma modalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {modalities.map(modality => (
                      <SelectItem key={modality.id} value={modality.id}>
                        {modality.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="minAge">Idade Mínima</Label>
                  <Input
                    id="minAge"
                    type="number"
                    value={form.ageRange?.min || ''}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        ageRange: {
                          min: parseInt(e.target.value) || 0,
                          max: prev.ageRange?.max || 0
                        }
                      }))
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="maxAge">Idade Máxima</Label>
                  <Input
                    id="maxAge"
                    type="number"
                    value={form.ageRange?.max || ''}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        ageRange: {
                          min: prev.ageRange?.min || 0,
                          max: parseInt(e.target.value) || 0
                        }
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {form.id ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
