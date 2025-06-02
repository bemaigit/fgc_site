'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ManageChampions from '../../components/ManageChampions'

interface ChampionshipEvent {
  id: string
  name: string
  year: number
  description?: string
}

// Componente Cliente que recebe o id como prop
export default function EditarEventoClient({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState<ChampionshipEvent>({
    id: id,
    name: '',
    year: new Date().getFullYear(),
    description: '',
  })

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/championships/events?id=${id}`)
        if (!response.ok) {
          throw new Error('Evento não encontrado')
        }
        
        const eventData = await response.json()
        if (Array.isArray(eventData) && eventData.length > 0) {
          setFormData({
            id: eventData[0].id,
            name: eventData[0].name,
            year: eventData[0].year,
            description: eventData[0].description || '',
          })
        } else {
          throw new Error('Evento não encontrado')
        }
      } catch (error) {
        console.error('Erro ao buscar evento:', error)
        toast.error('Erro ao carregar evento')
        router.push('/dashboard/campeoes/eventos')
      } finally {
        setLoadingData(false)
      }
    }

    fetchEvent()
  }, [id, router])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'year' ? parseInt(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/championships/events', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar evento')
      }

      toast.success('Evento atualizado com sucesso')
      router.push('/dashboard/campeoes/eventos')
    } catch (error) {
      console.error('Erro ao atualizar evento:', error)
      toast.error('Erro ao atualizar evento')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/championships/events?id=${formData.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir evento')
      }

      toast.success('Evento excluído com sucesso')
      router.push('/dashboard/campeoes/eventos')
    } catch (error) {
      console.error('Erro ao excluir evento:', error)
      toast.error('Erro ao excluir evento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Editar Evento de Campeonato</h1>

      <Tabs defaultValue="editar">
        <TabsList className="mb-6">
          <TabsTrigger value="editar">Editar Evento</TabsTrigger>
          <TabsTrigger value="gerenciar">Gerenciar Campeões</TabsTrigger>
        </TabsList>

        <TabsContent value="editar">
          {loadingData ? (
            <div className="flex justify-center">
              <p>Carregando evento...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Evento:</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nome do evento"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Ano:</Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  value={formData.year}
                  onChange={handleChange}
                  min={2000}
                  max={2100}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional):</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  placeholder="Descrição do evento"
                  rows={3}
                />
              </div>

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-32"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button
                  type="button"
                  onClick={() => router.push('/dashboard/campeoes/eventos')}
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleDelete}
                  variant="destructive"
                  disabled={loading}
                  className="ml-auto"
                >
                  Excluir
                </Button>
              </div>
            </form>
          )}
        </TabsContent>

        <TabsContent value="gerenciar">
          {loadingData ? (
            <div className="flex justify-center">
              <p>Carregando...</p>
            </div>
          ) : (
            <ManageChampions eventId={formData.id} eventName={formData.name} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
