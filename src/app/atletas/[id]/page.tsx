import { prisma } from '@/lib/prisma'
import { AthleteProfileClient } from '@/components/athletes/AthleteProfileClient'
import { notFound } from 'next/navigation'
import { AthleteDetails } from '@/types/athlete'

// Usamos o tipo AthleteDetails importado de @/types/athlete

// Função para buscar os detalhes do atleta pelo servidor
async function getAthleteDetails(id: string): Promise<AthleteDetails | null> {
  try {
    // Busca o atleta com todas as informações relacionadas diretamente do Prisma
    const athlete = await prisma.athlete.findUnique({
      where: { id },
      include: {
        AthleteProfile: {
          include: {
            EventCategory: true,  // Inclui os dados da categoria
            EventModality: true  // Inclui os dados da modalidade
          }
        },
        AthleteGallery: {
          orderBy: { order: 'asc' }
        },
        User_Athlete_userIdToUser: {
          select: {
            image: true
          }
        },
        Club: {
          select: {
            clubName: true,
            id: true
          }
        }
      }
    })
    
    if (!athlete) {
      return null
    }
    
    // Determina a imagem de perfil principal - priorizando a imagem do usuário
    const profileImage: string | null = 
      athlete.User_Athlete_userIdToUser?.image ??
      athlete.AthleteGallery?.find((img: any) => img.featured)?.imageUrl ?? 
      athlete.AthleteGallery?.[0]?.imageUrl ??
      null
    
    // Formata a resposta
    return {
      id: athlete.id,
      fullName: athlete.fullName,
      birthDate: athlete.birthDate.toISOString(),
      // Usa o nome da categoria do perfil se disponível, senão usa o ID da categoria do atleta
      category: athlete.AthleteProfile?.EventCategory?.name || athlete.category,
      // Usa o nome da modalidade do perfil se disponível, senão usa a modalidade padrão
      modality: athlete.AthleteProfile?.EventModality?.name || athlete.modalities?.[0] || 'Não informada',
      city: athlete.city,
      state: athlete.state,
      club: {
        id: athlete.Club?.id || null,
        name: athlete.Club?.clubName || 'Independente',
        logo: null // O campo logo ainda não existe no modelo Club
      },
      profileImage,
      biography: athlete.AthleteProfile?.biography || null,
      achievements: athlete.AthleteProfile?.achievements || null,
      socialMedia: athlete.AthleteProfile?.socialMedia as any || null,
      websiteUrl: athlete.AthleteProfile?.websiteUrl || null,
      gallery: athlete.AthleteGallery?.map((img: any) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        title: img.title,
        description: img.description,
        featured: img.featured
      })) || []
    }
  } catch (error) {
    console.error('Erro ao buscar perfil do atleta:', error)
    throw new Error('Erro ao buscar detalhes do atleta')
  }
}

export default async function AthleteProfilePage({ params }: { params: { id: string } }) {
  const athleteData = await getAthleteDetails(params.id)
  
  // Se o atleta não for encontrado, retorna 404
  if (!athleteData) {
    notFound()
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Passamos os dados do atleta para o componente cliente */}
      <AthleteProfileClient athlete={athleteData} />
    </div>
  )
}
