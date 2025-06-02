"use server"

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    console.log('API /athletes/me - Session:', JSON.stringify(session, null, 2))
    
    if (!session || !session.user) {
      console.log('API /athletes/me - Erro: Usuário não autenticado')
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const userId = session.user.id
    console.log('API /athletes/me - User ID:', userId)

    // Buscar dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        name: true,
        email: true, 
        role: true,
        image: true,
        isManager: true,
        managedClubId: true
        // createdAt não é um campo selecionável no modelo User
      }
    })
    
    if (!user) {
      console.log('API /athletes/me - Erro: Usuário não encontrado na base de dados')
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }
    
    // Buscar dados do atleta pelo ID do usuário
    const athlete = await prisma.athlete.findUnique({
      where: { userId },
      select: {
        id: true,
        fullName: true,
        cpf: true,
        birthDate: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        phone: true,
        modalities: true,
        category: true,
        // Removi 'team' se não for um campo válido no modelo Athlete
        active: true,
        paymentStatus: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    console.log('API /athletes/me - Resultado da busca de atleta:', athlete ? 'Atleta encontrado' : 'Atleta não encontrado')

    // Buscar inscrições em eventos do usuário
    // Verificando se o modelo EventRegistration existe no schema
    let eventRegistrations: any[] = []
    try {
      // Usando prisma.$queryRaw para evitar erros se a tabela não existir
      const registrations: any[] = await prisma.$queryRaw`
        SELECT er.id, er."userId", er."eventId", er."createdAt", 
               e.title, e."startDate", e."endDate", e.location, e.status
        FROM "EventRegistration" er
        JOIN "Event" e ON er."eventId" = e.id
        WHERE er."userId" = ${userId}
        ORDER BY er."createdAt" DESC
      `
      eventRegistrations = Array.isArray(registrations) ? registrations : []
    } catch (err) {
      console.error("Erro ao buscar inscrições em eventos:", err)
      eventRegistrations = []
    }

    console.log(`API /athletes/me - Inscrições encontradas: ${eventRegistrations.length}`)

    // Verificar se o atleta é realmente filiado (tem dados completos)
    // Um atleta só é considerado filiado se tiver CPF, data de nascimento e estiver ativo
    const isFiliado = athlete ? 
      (!!athlete.cpf && !!athlete.birthDate && athlete.active === true) : false;
    
    console.log('API /athletes/me - Status de filiação:', isFiliado ? 'Filiado' : 'Não filiado');
    
    // Verificar se o usuário é um dirigente
    const isManager = user.isManager || false;
    let managedClub = null;
    let clubAthletes = null;

    console.log('=== DEBUG PERFIL DIRIGENTE ===');
    console.log(`Usuário ${user.email} - isManager: ${isManager}`);
    console.log(`managedClubId: ${user.managedClubId || 'Nenhum'}`);
    
    // Se for dirigente, buscar informações do clube
    if (isManager && user.managedClubId) {
      console.log(`Buscando informações do clube: ${user.managedClubId}`);
      
      try {
        managedClub = await prisma.club.findUnique({
          where: { id: user.managedClubId },
          select: {
            id: true,
            clubName: true,
            cnpj: true,
            responsibleName: true,
            email: true,
            phone: true,
            active: true,
            paymentStatus: true,
            address: true,
            city: true,
            state: true,
            zipCode: true
          }
        });
        
        console.log(`Resultado da busca de clube: ${managedClub ? 'Clube encontrado' : 'Clube NÃO encontrado'}`);
        if (managedClub) {
          console.log(`Detalhes do clube: ${managedClub.clubName} (${managedClub.id})`);
          console.log(`Status do clube: ${managedClub.active ? 'Ativo' : 'Inativo'}`);
        }
      } catch (error) {
        console.error('Erro ao buscar clube:', error);
      }
      
      // Buscar atletas associados ao clube
      if (managedClub) {
        try {
          console.log(`Buscando atletas do clube ${managedClub.id}`);
          
          clubAthletes = await prisma.athlete.findMany({
            where: { 
              clubId: managedClub.id,
              isIndividual: false
            },
            select: {
              id: true,
              fullName: true,
              cpf: true,
              birthDate: true,
              phone: true,
              modalities: true,
              category: true,
              active: true,
              paymentStatus: true,
              userId: true
            },
            orderBy: { fullName: 'asc' }
          });
          
          console.log(`Atletas encontrados: ${clubAthletes.length}`);
        } catch (error) {
          console.error('Erro ao buscar atletas do clube:', error);
          clubAthletes = [];
        }
      } else {
        console.log('Clube não encontrado, não será possível buscar atletas');
      }
    } else {
      console.log('Usuário não é dirigente ou não tem clube associado');
    }

    // Retorna os dados do usuário, perfil de atleta (se existir) e inscrições
    return NextResponse.json({
      user,
      athlete,
      hasFiliation: isFiliado,
      eventRegistrations,
      isManager,
      managedClub,
      clubAthletes
    })
    
  } catch (error: any) {
    console.error("Erro ao buscar dados do perfil:", error)
    return NextResponse.json(
      { error: "Erro ao buscar dados do perfil", message: error.message },
      { status: 500 }
    )
  }
}
