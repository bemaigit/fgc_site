import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type EventRegulation } from '@/types/events'

interface UseEventRegulationProps {
  eventId: string | null | undefined
}

export function useEventRegulation({ eventId }: UseEventRegulationProps) {
  const queryClient = useQueryClient()

  const getRegulation = useCallback(async () => {
    if (!eventId) return null

    const response = await fetch(`/api/events/${eventId}/regulation`)
    if (!response.ok) throw new Error('Failed to fetch regulation')
    
    const { data } = await response.json()
    return data as EventRegulation
  }, [eventId])

  const { data, isLoading } = useQuery({
    queryKey: ['event-regulation', eventId],
    queryFn: getRegulation,
    enabled: Boolean(eventId)
  })

  const { mutateAsync: updateRegulation, isPending: isUpdating } = useMutation({
    mutationFn: async (regulationData: Partial<EventRegulation>) => {
      if (!eventId) throw new Error('Event ID is required')

      const response = await fetch(`/api/events/${eventId}/regulation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regulationData)
      })

      if (!response.ok) throw new Error('Failed to update regulation')
      
      const { data } = await response.json()
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-regulation', eventId] })
    }
  })

  return {
    data,
    isLoading,
    updateRegulation,
    isUpdating
  }
}
