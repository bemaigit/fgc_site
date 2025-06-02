export interface BaseEditorProps {
  eventId?: string | null
  initialData?: unknown
  isDisabled?: boolean
  onSaved?: () => void
}

export interface EventBasicInfo {
  title: string
  description: string
  startDate: Date | null
  endDate: Date | null
  registrationEnd: Date | null
  status: EventStatus
  published: boolean
  isFree: boolean
}

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED'

export interface EventLocation {
  countryId: string
  stateId: string
  cityId: string
  addressDetails: string
  zipCode?: string
  accessInstructions?: string
  latitude?: number
  longitude?: number
}

export interface EventModalities {
  modalityIds: string[]
  categoryIds: string[]
  genderIds: string[]
}

export interface EventImages {
  coverImage: string
  posterImage?: string | null
}

export interface EventRegulation {
  regulationPdf?: string | null
}

// Interface para lote com campos opcionais para permitir salvamento parcial
export interface PricingTier {
  id?: string
  name: string                    // Nome é obrigatório
  description?: string | null
  price: number                   // Preço é obrigatório
  startDate?: Date | null         // Data inicial é opcional para salvamento parcial
  endDate?: Date | null          // Data final é opcional para salvamento parcial
  maxEntries?: number | null     // Número máximo de inscrições é opcional
  active: boolean
}

export interface EventPricing {
  isFree: boolean
  pricingTiers: PricingTier[]
}

// Interface para criação de evento, incluindo todos os campos necessários do Prisma
export interface CreateEventInput extends EventBasicInfo, EventLocation {
  // Campos obrigatórios do Prisma
  location: string
  updatedAt: Date

  // Campos de relacionamento
  modalityIds: string[]
  categoryIds: string[]
  genderIds: string[]
  
  // Campos de mídia
  coverImage: string
  posterImage?: string | null
  regulationPdf?: string | null
  
  // Campos de preço
  EventPricingTier: PricingTier[]
}
