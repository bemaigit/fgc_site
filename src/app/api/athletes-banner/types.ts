// Tipo temporário para contornar erros até que o Prisma Client seja atualizado
export interface AthletesSectionBanner {
  id: string
  title: string
  subtitle?: string | null
  description?: string | null
  imageUrl: string
  ctaText: string
  active: boolean
  order: number
  createdAt: Date
  updatedAt: Date
  createdBy?: string | null
  updatedBy?: string | null
}

// Estender o cliente Prisma para acessar o modelo AthletesSectionBanner
export interface PrismaAthletesSectionBanner {
  findMany: (params?: any) => Promise<AthletesSectionBanner[]>
  findUnique: (params: { where: { id: string } }) => Promise<AthletesSectionBanner | null>
  findFirst: (params: any) => Promise<AthletesSectionBanner | null>
  create: (params: { data: Omit<AthletesSectionBanner, 'id' | 'createdAt' | 'updatedAt'> }) => Promise<AthletesSectionBanner>
  update: (params: { where: { id: string }, data: Partial<Omit<AthletesSectionBanner, 'id' | 'createdAt'>> }) => Promise<AthletesSectionBanner>
  delete: (params: { where: { id: string } }) => Promise<AthletesSectionBanner>
}

// Estender PrismaClient declarativamente
declare global {
  namespace PrismaClient {
    interface PrismaClient {
      athletesSectionBanner: PrismaAthletesSectionBanner
    }
  }
}
