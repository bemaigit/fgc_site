import useSWR from 'swr'

export interface EventGender {
  id: string
  name: string
  description?: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useEventGenders(activeOnly: boolean = false) {
  const queryParams = activeOnly ? '?active=true' : ''
  const { data, error, isLoading } = useSWR<EventGender[]>(
    `/api/events/genders${queryParams}`,
    fetcher
  )

  return {
    data: data || [],
    isLoading,
    error: error?.message || null
  }
}
