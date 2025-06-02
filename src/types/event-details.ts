export interface Modality {
  id: string
  name: string
  description: string
  maxParticipants: number
  currentParticipants: number
  price: number
}

export interface Category {
  id: string
  name: string
  ageRange: string
  gender: 'M' | 'F' | 'U'
  maxParticipants: number
  currentParticipants: number
  modalityId: string
}

export interface PricingTier {
  id: string
  name: string
  price: number
  startDate: Date
  endDate: Date
  maxEntries: number | null
  active: boolean
}

export interface EventDetails {
  id: string
  title: string
  description: string
  location: string
  locationUrl?: string
  modalities: Array<{
    id: string
    name: string
  }>
  categories: Array<{
    id: string
    name: string
  }>
  genders: Array<{
    id: string
    name: string
  }>
  startDate: Date
  endDate: Date | null
  registrationEnd: Date | null
  posterImage: string | null
  coverImage: string | null
  regulationPdf: string | null
  regulationText?: string | null
  resultsFile: string | null
  latitude: number | null
  longitude: number | null
  isFree: boolean
  published: boolean
  maxParticipants: number | null
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED'
  pricingTiers: Array<{
    id: string
    name: string
    description: string | null
    price: number
    startDate: Date
    endDate: Date
    maxEntries: number | null
    active: boolean
  }>
  registrations?: Array<any> 
}
