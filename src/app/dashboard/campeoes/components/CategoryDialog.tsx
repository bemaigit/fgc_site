'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CategoryDialogProps {
  isOpen: boolean
  onClose: () => void
  category?: ChampionCategory | null
  onCategorySaved: () => void
}

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
  modalityName?: string // Nome da modalidade para exibição
}

export default function CategoryDialog({
  isOpen,
  onClose,
  category,
  onCategorySaved,
}: CategoryDialogProps) {
  const [formData, setFormData] = useState<ChampionCategory>({
    id: '',
    name: '',
    modalityId: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [modalities, setModalities] = useState<ChampionModality[]>([])

  // Carregar modalidades disponíveis
  useEffect(() => {
    async function fetchModalities() {
      try {
        const response = await fetch('/api/championships/modalities')
        if (!response.ok) {
          throw new Error('Erro ao carregar modalidades')
        }
        const data = await response.json()
        setModalities(data)
      } catch (error) {
        console.error('Erro ao carregar modalidades:', error)
        toast.error('Erro ao carregar modalidades. Por favor, recarregue a página.')
      }
    }

    if (isOpen) {
      fetchModalities()
    }
  }, [isOpen])

  // Carregar dados da categoria para edição
  useEffect(() => {
    if (category) {
      setFormData({
        id: category.id,
        name: category.name,
        modalityId: category.modalityId,
        description: category.description || '',
      })
    } else {
      // Resetar o formulário para uma nova categoria
      setFormData({
        id: uuidv4(),
        name: '',
        modalityId: '',
        description: '',
      })
    }
  }, [category, isOpen])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (value: string, name: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.modalityId) {
      toast.error('Por favor, selecione uma modalidade.')
      return
    }
    
    setLoading(true)

    try {
      const response = await fetch('/api/championships/categories', {
        method: category ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar categoria')
      }

      toast.success(
        `Categoria ${category ? 'atualizada' : 'criada'} com sucesso`
      )
      onCategorySaved()
      onClose()
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error)
      toast.error(error.message || 'Erro ao salvar categoria. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Editar' : 'Criar'} Categoria
          </DialogTitle>
          <DialogDescription>
            {category
              ? 'Altere os detalhes da categoria.'
              : 'Crie uma nova categoria para registrar campeões.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="modalityId" className="text-right">
                Modalidade
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.modalityId}
                  onValueChange={(value) => handleSelectChange(value, 'modalityId')}
                  disabled={!!category} // Desabilitar alteração de modalidade ao editar
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma modalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {modalities.map((modality) => (
                      <SelectItem key={modality.id} value={modality.id}>
                        {modality.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!!category && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Não é possível alterar a modalidade de uma categoria existente.
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
