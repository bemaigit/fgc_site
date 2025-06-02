import { AthleteListClient } from '@/components/athletes'
import { prisma } from '@/lib/prisma'

interface SearchParams {
  search?: string
  category?: string
  modality?: string
  gender?: string
  page?: string
}

interface Modality {
  id: string
  name: string
}

interface Athlete {
  id: string
  fullName: string
  category: string
  club: string
  profileImage: string | null
  birthDate: string | null // Permitir nulo para casos onde a data não está disponível
  hasBiography: boolean
  hasGallery: boolean
  modalities: (Modality[] | string[] | any)
}

interface PaginationInfo {
  total: number
  page: number
  limit: number
  pages: number
}



// Esta função será executada no servidor
async function getAthletes(searchParams: SearchParams) {
  try {
    const page = Number(searchParams.page || '1')
    const limit = 12
    const searchTerm = typeof searchParams.search === 'string' ? searchParams.search : ''
    const categoryFilter = typeof searchParams.category === 'string' ? searchParams.category : ''
    const modalityFilter = typeof searchParams.modality === 'string' ? searchParams.modality : ''
    const genderFilter = typeof searchParams.gender === 'string' ? searchParams.gender : ''
    
    // Constrói o filtro com base nos parâmetros
    const offset = (page - 1) * limit

    // Construir o objeto de filtro para o AthleteProfile
    const athleteProfileFilter: any = {};
    
    if (categoryFilter) {
      athleteProfileFilter.categoryId = categoryFilter;
    }
    
    if (modalityFilter) {
      athleteProfileFilter.modalityId = modalityFilter;
    }
    
    if (genderFilter && genderFilter !== 'ALL') {
      athleteProfileFilter.genderId = genderFilter;
    }
    
    // Busca os atletas com filtros e paginação
    const athletes = await prisma.athlete.findMany({
      take: limit,
      skip: offset,
      where: {
        ...(searchTerm ? {
          fullName: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        } : {}),
        // Adicionar o filtro do perfil somente se houver alguma condição
        ...(Object.keys(athleteProfileFilter).length > 0 ? {
          AthleteProfile: athleteProfileFilter
        } : {}),
      },
      include: {
        User_Athlete_userIdToUser: {
          select: {
            image: true
          }
        },
        AthleteProfile: {
          select: {
            biography: true
          }
        },
        AthleteGallery: {
          orderBy: [
            { featured: 'desc' },
            { order: 'asc' }
          ],
          take: 5
        },
        Club: {
          select: {
            clubName: true
          }
        }
      },
      orderBy: {
        fullName: 'asc'
      },
    });

    // Conta o total de atletas que correspondem ao filtro
    const totalCount = await prisma.athlete.count({
      where: {
        ...(searchTerm ? {
          fullName: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        } : {}),
        // Usar o mesmo filtro de AthleteProfile que construímos antes
        ...(Object.keys(athleteProfileFilter).length > 0 ? {
          AthleteProfile: athleteProfileFilter
        } : {}),
      }
    })

    // Formatar os dados para o componente cliente
    const formattedAthletes = athletes.map((athlete: any) => {
      // Determinar imagem de perfil (usamos a imagem do usuário relacionado ou um placeholder)
      const profileImage = athlete.User_Athlete_userIdToUser?.image || null;

      // Mapear modalidades para formato legível (caso esteja usando o campo legado)
      const formattedModalities = Array.isArray(athlete.modalities) 
        ? athlete.modalities.map((modalityId: string) => {
            // Mapeamento de IDs conhecidos para nomes legíveis
            const idToName: Record<string, string> = {
              '00ef4e35-0e03-4387-ac8b-2e70a0ecef49': 'MTB',
              '402e9e9d-3fd1-49c9-b6f4-12413801fb14': 'ROAD',
              'b12a1f42-8530-4a25-ab1f-f3a4661e4929': 'SPEED',
              'bcddde3d-45d3-4a6c-a098-df953056e0d1': 'BMX'
            };
            
            return {
              id: modalityId,
              name: idToName[modalityId] || modalityId
            };
          })
        : []; // Array vazio se modalities não for um array
      
      // Verificar se temos dados do perfil do atleta
      const athleteProfile = athlete.AthleteProfile || {};
      
      // Obter o nome da modalidade e categoria a partir das relações
      const categoryName = athlete.category || 'Não classificado';
      
      return {
        id: athlete.id,
        fullName: athlete.fullName,
        category: categoryName, 
        club: athlete.club || 'Independente',
        profileImage,
        birthDate: athlete.birthDate ? new Date(athlete.birthDate).toISOString() : null,
        hasBiography: !!athleteProfile.biography,
        hasGallery: false, // Simplificando por enquanto
        modalities: formattedModalities
      };
    });

    const totalPages = Math.ceil(totalCount / limit)

    return {
      athletes: formattedAthletes,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: totalPages
      }
    }
  } catch (error) {
    console.error('Erro ao buscar dados iniciais de atletas:', error)
    return {
      athletes: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 12,
        pages: 0
      }
    }
  }
}

interface PageProps {
  searchParams: {
    page?: string, 
    search?: string, 
    category?: string, 
    modality?: string, 
    gender?: string
  }
}

export default async function AthleteListPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // No Next.js 13+, searchParams é um objeto ReadonlyURLSearchParams
  // que não deve ser acessado sincronicamente
  
  // Garantir que searchParams seja awaited antes de acessar suas propriedades
  const resolvedSearchParams = await Promise.resolve(searchParams);
  
  // Convertendo searchParams para o tipo correto antes de passar para getAthletes
  const params: SearchParams = {
    page: typeof resolvedSearchParams.page === 'string' ? resolvedSearchParams.page : undefined,
    search: typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : undefined,
    category: typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : undefined,
    modality: typeof resolvedSearchParams.modality === 'string' ? resolvedSearchParams.modality : undefined,
    gender: typeof resolvedSearchParams.gender === 'string' ? resolvedSearchParams.gender : undefined
  }
  
  const data = await getAthletes(params)
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner da página */}
      <div className="bg-[#08285d] text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold">Nossos Atletas</h1>
          <p className="mt-2 text-gray-300">
            Conheça os atletas que representam a Federação Goiana de Ciclismo
          </p>
        </div>
      </div>
      
      {/* Componente cliente que manipula a interatividade */}
      <AthleteListClient 
        initialData={{
          athletes: data.athletes,
          pagination: data.pagination
        }}
      />
    </div>
  )
}
