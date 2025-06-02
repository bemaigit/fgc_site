/**
 * Tipos compartilhados para o sistema de campeonatos
 */

export interface Athlete {
  id: string
  fullName: string
  image?: string | null
}

export interface ChampionshipEvent {
  id: string
  name: string
  year: number
  description?: string | null
}

export interface ChampionModality {
  id: string
  name: string
  description?: string | null
}

export interface ChampionCategory {
  id: string
  name: string
  modalityId: string
  modalityName?: string
  description?: string | null
}

export interface ChampionEntry {
  id: string
  athleteId: string
  modalityId: string
  categoryId: string
  gender: string
  position: number
  city: string
  team?: string  // Opcional para compatibilidade
  eventId: string
  athleteName?: string
  athleteImage?: string | null
  modalityName?: string
  categoryName?: string
  eventName?: string
  eventYear?: number
  athlete?: Athlete
}
