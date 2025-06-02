import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/athlete-profiles/[id] - Obtém detalhes de um perfil de atleta específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Garantir que params seja awaited antes de acessar suas propriedades
    const { id } = await Promise.resolve(params)
    
    if (!id) {
      return NextResponse.json({ error: 'ID do atleta não fornecido' }, { status: 400 })
    }
    
    // Busca o atleta com todas as informações relacionadas
    const athlete = await prisma.athlete.findUnique({
      where: { id },
      include: {
        AthleteProfile: {
          include: {
            EventModality: true,
            EventCategory: true,
            Gender: true
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
    }) as any // Usamos any aqui para contornar os problemas de tipagem
    
    if (!athlete) {
      return NextResponse.json({ error: 'Atleta não encontrado' }, { status: 404 })
    }
    
    // Determina a imagem de perfil principal (prioridade: foto de usuário, galeria destacada, ou null)
    const profileImage = 
      athlete.User_Athlete_userIdToUser?.image ||
      athlete.AthleteGallery?.find((img: any) => img.featured)?.imageUrl || 
      athlete.AthleteGallery?.[0]?.imageUrl ||
      null
    
    // Formata a resposta
    const formattedAthlete = {
      id: athlete.id,
      fullName: athlete.fullName,
      birthDate: athlete.birthDate,
      category: athlete.category,
      city: athlete.city,
      state: athlete.state,
      club: {
        id: athlete.Club?.id,
        name: athlete.Club?.clubName || 'Independente',
        logo: null // Campo removido por incompatibilidade com o schema
      },
      profileImage,
      biography: athlete.AthleteProfile?.biography || null,
      achievements: athlete.AthleteProfile?.achievements || null,
      socialMedia: athlete.AthleteProfile?.socialMedia || null,
      websiteUrl: athlete.AthleteProfile?.websiteUrl || null,
      gender: athlete.AthleteProfile?.gender || null,
      // Incluir os novos campos relacionais
      modalityId: athlete.AthleteProfile?.modalityId || null,
      categoryId: athlete.AthleteProfile?.categoryId || null,
      genderId: athlete.AthleteProfile?.genderId || null,
      // Incluir informações sobre modalidade, categoria e gênero
      modality: athlete.AthleteProfile?.EventModality?.name || null,
      categoryName: athlete.AthleteProfile?.EventCategory?.name || null,
      genderName: athlete.AthleteProfile?.Gender?.name || null,
      gallery: athlete.AthleteGallery?.map((img: any) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        title: img.title,
        description: img.description,
        featured: img.featured
      })) || []
    }
    
    return NextResponse.json(formattedAthlete)
  } catch (error) {
    console.error('Erro ao buscar perfil do atleta:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar perfil do atleta' },
      { status: 500 }
    )
  }
}

// PATCH /api/athlete-profiles/[id] - Atualiza o perfil de um atleta
// Usado pelo próprio atleta ou pelo administrador
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Garantir que params seja awaited antes de acessar suas propriedades
    const { id } = await Promise.resolve(params)
    const session = await getServerSession(authOptions)
    
    // Verifica autenticação
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    // Verifica permissões: ou é o próprio atleta ou é um admin
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
    const isOwner = session.user.id === id
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Sem permissão para esta operação' }, { status: 403 })
    }
    
    const data = await request.json()
    
    // Tenta encontrar o atleta pelo ID fornecido
    let athlete = await prisma.athlete.findUnique({
      where: { id }
    })
    
    // Se não encontrar, tenta encontrar pelo userId
    if (!athlete) {
      athlete = await prisma.athlete.findFirst({
        where: { userId: id }
      })
    }
    
    if (!athlete) {
      return NextResponse.json(
        { error: 'Atleta não encontrado' },
        { status: 404 }
      )
    }
    
    // Usa o ID real do atleta para as operações seguintes
    const athleteId = athlete.id
    
    // Valida os IDs de categoria, modalidade e gênero se fornecidos
    console.log('Dados recebidos:', JSON.stringify(data, null, 2));
    
    // Lista todas as categorias disponíveis para debug
    const allCategories = await prisma.eventCategory.findMany();
    console.log('Categorias disponíveis:', JSON.stringify(allCategories, null, 2));
    
    // Processa os dados para extrair os IDs corretos se necessário
    const processedData = { ...data };
    
    if (data.categoryId) {
      // Extrai o ID da categoria antes do hífen, se houver
      const categoryId = data.categoryId.split('-')[0];
      console.log('Buscando categoria com ID processado:', categoryId);
      
      const categoryExists = await prisma.eventCategory.findUnique({
        where: { id: categoryId }
      });
      
      if (!categoryExists) {
        return NextResponse.json(
          { 
            error: 'Categoria inválida',
            details: `Categoria com ID ${categoryId} não encontrada`
          },
          { status: 400 }
        );
      }
      
      // Atualiza o categoryId com o valor processado
      processedData.categoryId = categoryId;
    }
    
    if (processedData.modalityId) {
      const modalityId = processedData.modalityId.split('-')[0];
      console.log('Buscando modalidade com ID processado:', modalityId);
      
      // Lista todas as modalidades disponíveis para debug
      const allModalities = await prisma.eventModality.findMany();
      console.log('Modalidades disponíveis:', JSON.stringify(allModalities, null, 2));
      
      const modalityExists = await prisma.eventModality.findUnique({
        where: { id: modalityId }
      });
      
      console.log('Modalidade encontrada:', JSON.stringify(modalityExists, null, 2));
      
      if (!modalityExists) {
        return NextResponse.json(
          { 
            error: 'Modalidade inválida',
            details: `Modalidade com ID ${modalityId} não encontrada`
          },
          { status: 400 }
        );
      }
      
      // Atualiza o modalityId com o valor processado
      processedData.modalityId = modalityId;
    }
    
    if (processedData.genderId) {
      // Usa o ID completo do gênero sem fazer split
      const genderId = processedData.genderId;
      console.log('Buscando gênero com ID:', genderId);
      
      // Lista todos os gêneros disponíveis para debug
      const allGenders = await prisma.gender.findMany();
      console.log('Gêneros disponíveis:', JSON.stringify(allGenders, null, 2));
      
      const genderExists = await prisma.gender.findUnique({
        where: { id: genderId }
      });
      
      console.log('Gênero encontrado:', JSON.stringify(genderExists, null, 2));
      
      if (!genderExists) {
        return NextResponse.json(
          { 
            error: 'Gênero inválido',
            details: `Gênero com ID ${genderId} não encontrado`
          },
          { status: 400 }
        );
      }
      
      // Atualiza o genderId com o valor processado
      processedData.genderId = genderId;
    }
    
    // Obtém o perfil existente
    const existingProfile = await prisma.athleteProfile.findUnique({
      where: { athleteId }
    })
    
    if (existingProfile) {
      // Prepara os dados para atualização
      const updateData = {
        biography: processedData.biography,
        achievements: processedData.achievements,
        socialMedia: processedData.socialMedia,
        websiteUrl: processedData.websiteUrl,
        modalityId: processedData.modalityId,
        categoryId: processedData.categoryId,
        genderId: processedData.genderId,
        updatedAt: new Date()
      }
      
      // Atualiza o perfil existente
      const updatedProfile = await prisma.athleteProfile.update({
        where: { id: existingProfile.id },
        data: updateData
      })
      
      return NextResponse.json(updatedProfile)
    } else {
      // Prepara os dados para criação
      const createData = {
        athleteId,
        biography: processedData.biography,
        achievements: processedData.achievements,
        socialMedia: processedData.socialMedia,
        websiteUrl: processedData.websiteUrl,
        modalityId: processedData.modalityId,
        categoryId: processedData.categoryId,
        genderId: processedData.genderId
      }
      
      // Gera um ID único para o novo perfil
      const profileId = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date()
      
      // Cria um novo perfil com ID gerado e timestamps
      const newProfile = await prisma.athleteProfile.create({
        data: {
          ...createData,
          id: profileId,
          createdAt: now,
          updatedAt: now
        }
      })
      
      return NextResponse.json(newProfile)
    }
  } catch (error) {
    console.error('Erro ao atualizar perfil do atleta:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil do atleta' },
      { status: 500 }
    )
  }
}
