'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ChampionshipEvent {
  id: string
  name: string
  year: number
  description?: string
}

export default function CriarEventoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ChampionshipEvent>({
    id: uuidv4(),
    name: `Campeonato Goiano ${new Date().getFullYear()}`,
    year: new Date().getFullYear(),
    description: '',
  })

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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Erro ao criar evento de campeonato')
      }

      toast.success('Evento criado com sucesso')
      router.push('/dashboard/campeoes/eventos')
      router.refresh()
    } catch (error) {
      console.error('Erro ao criar evento:', error)
      toast.error('Erro ao criar evento. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Eventos</h1>

      <Tabs defaultValue="criar-evento" className="mb-6">
        <TabsList>
          <TabsTrigger value="lista-eventos" onClick={() => router.push('/dashboard/campeoes/eventos')}>
            Lista de Eventos
          </TabsTrigger>
          <TabsTrigger value="criar-evento">Adicionar Evento</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Criar Evento de Campeonato</h2>

        <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-base">
                Nome do Evento
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full mt-1"
                required
                placeholder="Ex: Campeonato Goiano Elite 2025"
              />
            </div>

            <div>
              <Label htmlFor="year" className="text-base">
                Temporada
              </Label>
              <Input
                id="year"
                name="year"
                type="number"
                value={formData.year}
                onChange={handleChange}
                className="w-full mt-1"
                required
                min={1900}
                max={2100}
                placeholder="Ano do evento"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-base">
                Descrição
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full mt-1"
                rows={4}
                placeholder="Informações adicionais sobre o evento (opcional)"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Criando Evento...' : 'Criar Evento'}
          </Button>
        </form>
      </div>
    </div>
  )
}
