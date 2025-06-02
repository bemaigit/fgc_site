'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Trash, Pencil } from 'lucide-react'

export interface RankingModality {
  id: string
  name: string
  description?: string
  active: boolean
}

export interface ModalityManagerProps {
  modalities: RankingModality[]
  onAdd: (modality: Partial<RankingModality>) => Promise<void>
  onEdit: (id: string, modality: Partial<RankingModality>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function ModalityManager({
  modalities,
  onAdd,
  onEdit,
  onDelete
}: ModalityManagerProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Partial<RankingModality>>({ active: true })

  const handleSave = async () => {
    try {
      if (!form.name?.trim()) {
        throw new Error('Nome é obrigatório')
      }

      if (form.id) {
        await onEdit(form.id, form)
      } else {
        await onAdd(form)
      }
      setOpen(false)
      setForm({ active: true })
      toast({
        title: 'Sucesso',
        description: `Modalidade ${form.id ? 'atualizada' : 'criada'} com sucesso`
      })
    } catch (error) {
      // Verifica se é um erro de conflito (modalidade já existe)
      if (error instanceof Error && error.message.includes('já existe')) {
        toast({
          variant: 'destructive',
          title: 'Modalidade já existe',
          description: 'Já existe uma modalidade com este nome no sistema.'
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: error instanceof Error ? error.message : 'Erro ao salvar modalidade'
        })
      }
    }
  }

  // Confirmação antes de excluir
  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a modalidade ${name}?`)) {
      onDelete(id)
    }
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Modalidades</h2>
        <Button onClick={() => {
          setForm({ active: true })
          setOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Modalidade
        </Button>
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-12 px-4 text-left align-middle font-medium">Nome</th>
              <th className="h-12 px-4 text-left align-middle font-medium">Descrição</th>
              <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
              <th className="h-12 px-4 text-right align-middle font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {modalities.map((modality) => (
              <tr key={modality.id} className="border-b">
                <td className="p-4">{modality.name}</td>
                <td className="p-4">{modality.description}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    modality.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {modality.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setForm(modality)
                      setOpen(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(modality.id, modality.name)}
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
              {form.id ? 'Editar Modalidade' : 'Nova Modalidade'}
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
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={form.description || ''}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={form.active}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, active: checked }))
                  }
                />
                <Label htmlFor="active">Modalidade Ativa</Label>
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
