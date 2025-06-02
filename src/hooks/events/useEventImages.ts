import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type EventImages } from '@/types/events'

interface UseEventImagesProps {
  eventId: string | null | undefined
}

export function useEventImages({ eventId }: UseEventImagesProps) {
  const queryClient = useQueryClient()

  const getImages = useCallback(async () => {
    if (!eventId) return null

    const response = await fetch(`/api/events/${eventId}/images`)
    if (!response.ok) throw new Error('Failed to fetch images')
    
    const { data } = await response.json()
    return data as EventImages
  }, [eventId])

  const { data, isLoading } = useQuery({
    queryKey: ['event-images', eventId],
    queryFn: getImages,
    enabled: Boolean(eventId)
  })

  const { mutateAsync: updateImages, isPending: isUpdating } = useMutation({
    mutationFn: async (imageData: Partial<EventImages>) => {
      if (!eventId) throw new Error('Event ID is required')

      const response = await fetch(`/api/events/${eventId}/images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imageData)
      })

      if (!response.ok) throw new Error('Failed to update images')
      
      const { data } = await response.json()
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-images', eventId] })
    }
  })

  return {
    data,
    isLoading,
    updateImages,
    isUpdating
  }
}
