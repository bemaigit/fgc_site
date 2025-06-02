"use server"

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(request: Request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const data = await request.json()

    // Buscar o registro de atleta atual
    const currentAthlete = await prisma.athlete.findUnique({
      where: { userId }
    })

    if (!currentAthlete) {
      return NextResponse.json(
        { error: "Atleta não encontrado" },
        { status: 404 }
      )
    }

    // Iniciar transação para garantir consistência
    return await prisma.$transaction(async (tx) => {
      // 1. Atualizar dados básicos do atleta (apenas informações de contato)
      const updateData: any = {
        phone: data.phone,
        city: data.city,
        state: data.state,
      };
      
      // Removendo campos que não devem ser atualizados na tabela Athlete
      // Estes campos são oficiais e só podem ser alterados via processo de filiação
      const protectedFields = ['modalities', 'category', 'gender', 'fullName', 'cpf', 'birthDate'];
      protectedFields.forEach(field => {
        if (field in data) {
          delete (data as any)[field];
        }
      });

      // 2. Processar clube/equipe se fornecido
      if (data.team) {
        // Verificar se o clube já existe
        let club = await tx.club.findFirst({
          where: { clubName: data.team }
        });

        if (!club) {
          // Criar um novo clube se não existir
          club = await tx.club.create({
            data: {
              id: crypto.randomUUID(),
              clubName: data.team,
              responsibleName: currentAthlete.fullName,
              cnpj: '00.000.000/0000-00',
              phone: currentAthlete.phone || '',
              email: currentAthlete.email || 'contato@clube.com',
              address: currentAthlete.address || 'Endereço não informado',
              city: data.city || currentAthlete.city || 'Cidade não informada',
              state: data.state || currentAthlete.state || 'UF',
              zipCode: currentAthlete.zipCode || '00000-000',
              active: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }
        
        // Conectar o atleta ao clube
        updateData.clubId = club.id;
      }

      // 3. Preparar dados do perfil público do atleta (AthleteProfile)
      const profileData: any = {
        updatedAt: new Date(),
      };

      // Atualizar apenas os campos que foram fornecidos
      if (data.modalities?.length > 0) {
        const firstModality = data.modalities[0];
        // Verificar se a modalidade existe
        const modalityExists = await tx.eventModality.findUnique({
          where: { id: firstModality }
        });
        
        if (modalityExists) {
          profileData.modalityId = firstModality;
        }
      }

      if (data.category) {
        // Verificar se a categoria existe
        const categoryExists = await tx.eventCategory.findUnique({
          where: { id: data.category }
        });
        
        if (categoryExists) {
          profileData.categoryId = data.category;
        }
      }

      // 4. Atualizar ou criar o perfil público do atleta
      const existingProfile = await tx.athleteProfile.findUnique({
        where: { athleteId: currentAthlete.id }
      });

      if (existingProfile) {
        // Atualizar perfil existente
        await tx.athleteProfile.update({
          where: { id: existingProfile.id },
          data: profileData
        });
      } else if (Object.keys(profileData).length > 1) {
        // Criar novo perfil apenas se houver dados além do updatedAt
        await tx.athleteProfile.create({
          data: {
            id: crypto.randomUUID(),
            athleteId: currentAthlete.id,
            ...profileData
          }
        });
      }

      // 5. Atualizar apenas as informações de contato do atleta
      // (dados oficiais não são modificados aqui)
      const updatedAthlete = await tx.athlete.update({
        where: { userId },
        data: updateData,
        include: {
          Club: true
        }
      });

      // Buscar o perfil completo do atleta para retornar os dados atualizados
      const athleteProfile = await tx.athleteProfile.findUnique({
        where: { athleteId: updatedAthlete.id },
        include: {
          EventModality: true,
          EventCategory: true,
          Gender: true
        }
      });

      // 5. Atualizar o nome do usuário se fornecido
      if (data.name) {
        await tx.user.update({
          where: { id: userId },
          data: { name: data.name }
        });
      }

      // 6. Retornar os dados atualizados
      // Incluir os dados oficiais do atleta (da tabela Athlete)
      const responseData: any = {
        ...updatedAthlete,
        // Incluir dados do perfil público (se existirem)
        athleteProfile: athleteProfile || null,
        // Manter compatibilidade com o frontend existente
        modalities: athleteProfile?.modalityId 
          ? [{ 
              id: athleteProfile.modalityId,
              name: athleteProfile.EventModality?.name || 'Modalidade não encontrada'
            }]
          : [],
        category: athleteProfile?.categoryId
          ? {
              id: athleteProfile.categoryId,
              name: athleteProfile.EventCategory?.name || 'Categoria não encontrada'
            }
          : null
      };

      return NextResponse.json(responseData);
    });

    // O retorno já está sendo feito dentro da transação
  } catch (error) {
    console.error("Erro ao atualizar dados do atleta:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar dados do atleta" },
      { status: 500 }
    )
  }
}
