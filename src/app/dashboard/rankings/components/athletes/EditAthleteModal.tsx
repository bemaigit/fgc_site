'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface Athlete {
  id: string
  name: string  // Nome do atleta
  modality: string // Modalidade 
  category: string // Categoria
  gender: string // Gênero (MALE/FEMALE)
  city?: string // Cidade
  team?: string // Equipe
  points: number // Pontuação no ranking
  position: number // Posição no ranking
  active?: boolean // Status ativo/inativo
  athleteId?: string // ID do registro de atleta
}

interface EditAthleteModalProps {
  isOpen: boolean
  onClose: () => void
  athlete: Athlete | null
  onSave: () => void
}

export function EditAthleteModal({ isOpen, onClose, athlete, onSave }: EditAthleteModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  
  // Estados para os campos do formulário
  const [name, setName] = useState('')
  const [points, setPoints] = useState(0)
  const [city, setCity] = useState('')
  const [team, setTeam] = useState('')
  const [active, setActive] = useState(true)

  // Atualiza os estados quando o atleta muda
  useEffect(() => {
    if (athlete) {
      console.log('Dados do atleta recebidos para edição:', athlete)
      setName(athlete.name || '')
      setPoints(athlete.points || 0)
      setCity(athlete.city || '')
      setTeam(athlete.team || '')
      setActive(athlete.active !== false) // Se não for explicitamente false, considera true
    }
  }, [athlete])

  const handleSave = async () => {
    if (!athlete) return
    
    if (!name) {
      toast({
        title: 'Erro',
        description: 'Nome é um campo obrigatório.',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/rankings/athletes/${athlete.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          points,
          city,
          team,
          active
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao atualizar atleta')
      }

      toast({
        title: 'Sucesso',
        description: 'Atleta atualizado com sucesso!'
      })

      onSave()
      onClose()
    } catch (error) {
      console.error('Erro ao atualizar atleta:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar atleta',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Atleta</DialogTitle>
          <DialogDescription>
            Atualize as informações do atleta. Os campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome *</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="points">Pontos</Label>
            <Input 
              id="points" 
              type="number" 
              value={points} 
              onChange={(e) => setPoints(Number(e.target.value))} 
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="city">Cidade</Label>
            <Input 
              id="city" 
              value={city} 
              onChange={(e) => setCity(e.target.value)} 
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="team">Equipe</Label>
            <Input 
              id="team" 
              value={team} 
              onChange={(e) => setTeam(e.target.value)} 
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="active">Status</Label>
            <Select 
              value={active ? 'true' : 'false'} 
              onValueChange={(value) => setActive(value === 'true')}
            >
              <SelectTrigger id="active">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Ativo</SelectItem>
                <SelectItem value="false">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
