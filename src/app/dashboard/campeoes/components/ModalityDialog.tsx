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

interface ModalityDialogProps {
  isOpen: boolean
  onClose: () => void
  modality?: ChampionModality | null
  onModalitySaved: () => void
}

interface ChampionModality {
  id: string
  name: string
  description?: string
}

export default function ModalityDialog({
  isOpen,
  onClose,
  modality,
  onModalitySaved,
}: ModalityDialogProps) {
  const [formData, setFormData] = useState<ChampionModality>({
    id: '',
    name: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)

  // Carregar dados da modalidade para edição
  useEffect(() => {
    if (modality) {
      setFormData({
        id: modality.id,
        name: modality.name,
        description: modality.description || '',
      })
    } else {
      // Resetar o formulário para uma nova modalidade
      setFormData({
        id: uuidv4(),
        name: '',
        description: '',
      })
    }
  }, [modality, isOpen])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/championships/modalities', {
        method: modality ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar modalidade')
      }

      toast.success(
        `Modalidade ${modality ? 'atualizada' : 'criada'} com sucesso`
      )
      onModalitySaved()
      onClose()
    } catch (error) {
      console.error('Erro ao salvar modalidade:', error)
      toast.error('Erro ao salvar modalidade. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {modality ? 'Editar' : 'Criar'} Modalidade
          </DialogTitle>
          <DialogDescription>
            {modality
              ? 'Altere os detalhes da modalidade.'
              : 'Crie uma nova modalidade para registrar campeões.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
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
