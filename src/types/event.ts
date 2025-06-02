// Definição de tipos para eventos

export interface ApiEvent {
  id: string
  title: string
  description?: string
  slug?: string
  location?: string
  locationUrl?: string
  startDate: string | Date
  endDate: string | Date
  registrationEnd?: string | Date
  status?: string
  published: boolean
  isFree?: boolean
  addressDetails?: string
  zipCode?: string
  latitude?: number
  longitude?: number
  countryId?: string
  stateId?: string
  cityId?: string
  coverImage?: string | null
  posterImage?: string | null
  regulationPdf?: string | null
  EventToModality?: Array<{
    EventModality: {
      id: string
      name: string
    }
  }>
  EventToCategory?: Array<{
    EventCategory: {
      id: string
      name: string
    }
  }>
  EventToGender?: Array<{
    Gender: {
      id: string
      name: string
    }
  }>
  EventPricingTier?: Array<{
    id: string
    name: string
    description?: string | null
    price: number
    startDate?: string | Date
    endDate?: string | Date
    maxEntries?: number | null
    active: boolean
  }>
}
