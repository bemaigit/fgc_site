// Tipos relacionados a atletas

// Representa os dados básicos de um atleta
export interface AthleteBase {
  id: string
  fullName: string
  birthDate: string
  category: string
  modality: string // Adicionado campo de modalidade
  city: string
  state: string
  profileImage?: string | null
}

// Usado na listagem de atletas
export interface AthleteListItem extends AthleteBase {
  club: string
  hasBiography: boolean
  hasGallery: boolean
}

// Representa uma imagem na galeria do atleta
export interface AthleteGalleryImage {
  id: string
  imageUrl: string
  title: string | null
  description: string | null
  featured: boolean
  order?: number
}

// Tipo para redes sociais do atleta
export interface AthleteSocialMedia {
  instagram: string | null
  facebook: string | null
  twitter: string | null
}

// Representa os detalhes completos de um atleta
export interface AthleteDetails extends AthleteBase {
  club: {
    id: string | null
    name: string
    logo: string | null
  }
  biography: string | null
  achievements: string | null
  socialMedia: AthleteSocialMedia | null
  websiteUrl: string | null
  gallery: AthleteGalleryImage[]
}

// Tipo para a resposta paginada de atletas
export interface PaginatedAthleteResponse {
  athletes: AthleteListItem[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

// Tipo para opções de filtro (como categorias)
export interface FilterOption {
  value: string
  label: string
}
