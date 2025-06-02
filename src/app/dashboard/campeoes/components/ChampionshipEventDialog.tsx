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

interface ChampionshipEventDialogProps {
  isOpen: boolean
  onClose: () => void
  event?: ChampionshipEvent | null
  onEventSaved: () => void
}

interface ChampionshipEvent {
  id: string
  name: string
  year: number
  description?: string
}

export default function ChampionshipEventDialog({
  isOpen,
  onClose,
  event,
  onEventSaved,
}: ChampionshipEventDialogProps) {
  const [formData, setFormData] = useState<ChampionshipEvent>({
    id: '',
    name: '',
    year: new Date().getFullYear(),
    description: '',
  })
  const [loading, setLoading] = useState(false)

  // Carregar dados do evento para edição
  useEffect(() => {
    if (event) {
      setFormData({
        id: event.id,
        name: event.name,
        year: event.year,
        description: event.description || '',
      })
    } else {
      // Resetar o formulário para um novo evento
      setFormData({
        id: uuidv4(),
        name: `Campeonato Goiano ${new Date().getFullYear()}`,
        year: new Date().getFullYear(),
        description: '',
      })
    }
  }, [event, isOpen])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'year' ? parseInt(value) || new Date().getFullYear() : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/championships/events', {
        method: event ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar evento de campeonato')
      }

      toast.success(
        `Evento ${event ? 'atualizado' : 'criado'} com sucesso`
      )
      onEventSaved()
      onClose()
    } catch (error) {
      console.error('Erro ao salvar evento:', error)
      toast.error('Erro ao salvar evento. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {event ? 'Editar' : 'Criar'} Evento de Campeonato
          </DialogTitle>
          <DialogDescription>
            {event
              ? 'Altere os detalhes do evento de campeonato.'
              : 'Crie um novo evento de campeonato para registrar campeões.'}
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
                className="col-span-3 w-full"
                required
                size={50}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year" className="text-right">
                Ano
              </Label>
              <Input
                id="year"
                name="year"
                type="number"
                value={formData.year}
                onChange={handleChange}
                className="col-span-3"
                required
                min={1900}
                max={2100}
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
