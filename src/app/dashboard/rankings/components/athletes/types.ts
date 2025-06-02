// Tipos para gerenciamento de atletas no ranking

export interface Athlete {
  id: string
  athleteId: string
  fullName: string
  modality: string
  category: string
  gender: string
  city?: string
  team?: string
  points: number
  position: number
}
