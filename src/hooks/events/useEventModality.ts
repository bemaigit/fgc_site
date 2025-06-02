import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type EventModalities } from '@/types/events'
import { useToasts } from '@/hooks/ui/useToasts'

interface UseEventModalityProps {
  eventId: string | null | undefined
}

export function useEventModality({ eventId }: UseEventModalityProps) {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToasts()

  const getModality = useCallback(async () => {
    if (!eventId) return null

    const response = await fetch(`/api/events/${eventId}/modality`)
    if (!response.ok) throw new Error('Failed to fetch modality')
    
    const { data } = await response.json()
    return data as EventModalities
  }, [eventId])

  const { data, isLoading } = useQuery({
    queryKey: ['event-modality', eventId],
    queryFn: getModality,
    enabled: Boolean(eventId)
  })

  const { mutateAsync: updateModality, isPending: isUpdating } = useMutation({
    mutationFn: async (modalityData: Partial<EventModalities>) => {
      if (!eventId) throw new Error('Event ID is required')

      const response = await fetch(`/api/events/${eventId}/modality`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modalityData)
      })

      if (!response.ok) throw new Error('Failed to update modality')
      
      const { data } = await response.json()
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-modality', eventId] })
      showSuccess({
        title: 'Modalidade atualizada',
        description: 'As informações da modalidade foram atualizadas com sucesso.'
      })
    },
    onError: () => {
      showError({
        title: 'Erro ao atualizar modalidade',
        description: 'Não foi possível atualizar as informações da modalidade. Tente novamente.'
      })
    }
  })

  return {
    data,
    isLoading,
    updateModality,
    isUpdating
  }
}
