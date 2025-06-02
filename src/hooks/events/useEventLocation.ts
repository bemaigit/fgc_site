import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type EventLocation } from '@/types/events'

interface UseEventLocationProps {
  eventId: string | null | undefined
}

export function useEventLocation({ eventId }: UseEventLocationProps) {
  const queryClient = useQueryClient()

  const getLocation = useCallback(async () => {
    if (!eventId) return null

    const response = await fetch(`/api/events/${eventId}/location`)
    if (!response.ok) throw new Error('Failed to fetch location')
    
    const { data } = await response.json()
    return data as EventLocation
  }, [eventId])

  const { data, isLoading } = useQuery({
    queryKey: ['event-location', eventId],
    queryFn: getLocation,
    enabled: Boolean(eventId)
  })

  const { mutateAsync: updateLocation, isPending: isUpdating } = useMutation({
    mutationFn: async (locationData: Partial<EventLocation>) => {
      if (!eventId) throw new Error('Event ID is required')

      const response = await fetch(`/api/events/${eventId}/location`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationData)
      })

      if (!response.ok) throw new Error('Failed to update location')
      
      const { data } = await response.json()
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-location', eventId] })
    }
  })

  return {
    data,
    isLoading,
    updateLocation,
    isUpdating
  }
}
