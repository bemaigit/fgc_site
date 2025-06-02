import { useState, useEffect } from 'react'

export interface Athlete {
  id: string
  name: string
  modality: string
  category: string
  gender: string
  points: number
  position: number
  city: string
  team: string | null
}

interface UseAthletesProps {
  modality?: string
  category?: string
  gender?: string
}

export function useAthletes({ modality, category, gender }: UseAthletesProps = {}) {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAthletes = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // Construir a URL com os parâmetros de filtro
        let url = '/api/rankings/athletes'
        const params = new URLSearchParams()
        
        if (modality && modality !== 'ALL') params.append('modality', modality)
        if (category && category !== 'ALL') params.append('category', category)
        if (gender && gender !== 'ALL') params.append('gender', gender)
        
        const queryString = params.toString()
        if (queryString) url += `?${queryString}`
        
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error('Falha ao carregar atletas')
        }
        
        const data = await response.json()
        setAthletes(data.data || [])
      } catch (err) {
        console.error('Erro ao buscar atletas:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar atletas')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAthletes()
  }, [modality, category, gender])

  return { athletes, isLoading, error }
}
