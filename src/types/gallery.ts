export interface GalleryImage {
  id: string
  url: string
  thumbnail: string
  filename: string
  size: number
  createdAt: string
  updatedAt: string
}

export interface Gallery {
  id: string
  title: string
  description: string | null
  modality: string
  category: string
  date: string
  slug: string
  createdAt: string
  updatedAt: string
  GalleryImage: GalleryImage[]
  _count: {
    GalleryImage: number
  }
}

export interface GalleryListResponse {
  data: Gallery[]
  pagination: {
    total: number
    page: number
    totalPages: number
    limit: number
  }
}
