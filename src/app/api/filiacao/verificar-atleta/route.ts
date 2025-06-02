import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Verificar se o usuário está autenticado
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Obter CPF dos parâmetros da consulta
    const cpf = request.nextUrl.searchParams.get("cpf");
    if (!cpf) {
      return NextResponse.json({ error: "CPF é obrigatório" }, { status: 400 });
    }

    // Limpar CPF (remover caracteres não numéricos)
    const cleanedCpf = cpf.replace(/\D/g, "");
    
    console.log("Searching for athlete with CPF:", cleanedCpf);
    
    // Buscar atleta pelo CPF - tente com filtro first() para contornar possíveis problemas
    const athlete = await prisma.athlete.findFirst({
      where: { 
        cpf: cleanedCpf 
      },
      include: {
        Club: true
      }
    });
    
    // Logs detalhados para debug
    console.log("Athlete found:", athlete ? "Yes" : "No");
    console.log("CPF utilizado na busca:", cleanedCpf);
    
    // Se não encontrou, tente verificar se existe algum atleta no sistema
    if (!athlete) {
      const anyAthlete = await prisma.athlete.findFirst();
      console.log("Existe algum atleta no sistema?", anyAthlete ? "Sim" : "Não");
      if (anyAthlete) {
        console.log("Exemplo de CPF existente:", anyAthlete.cpf);
      }
    }
    if (athlete) {
      console.log("Athlete structure:", Object.keys(athlete));
    }

    if (!athlete) {
      return NextResponse.json({
        found: false,
        message: "Atleta não encontrado"
      }, { status: 200 });
    }

    // Usar typecast para evitar erros de tipagem, já que estamos verificando a estrutura
    const athleteAny = athlete as any;
    
    // Transformar os dados para o formato esperado pelo formulário
    const formattedAthlete = {
      id: athleteAny.id,
      fullName: athleteAny.fullName,
      cpf: athleteAny.cpf,
      email: athleteAny.email,
      cbcRegistration: athleteAny.cbcRegistration || "",
      birthDate: athleteAny.birthDate,
      phone: athleteAny.phone,
      zipCode: athleteAny.zipCode,
      address: athleteAny.address,
      city: athleteAny.city,
      state: athleteAny.state,
      isIndividual: athleteAny.isIndividual,
      clubId: athleteAny.clubId,
      // Informações do clube de forma segura
      club: athleteAny.club ? {
        id: athleteAny.club.id,
        clubName: athleteAny.club.clubName,
      } : null,
      category: athleteAny.category,
      // Extrair array de IDs das modalidades de forma segura
      modalities: athleteAny.modalities ? 
        athleteAny.modalities.map((m: any) => m.id) : 
        [],
      // Outras informações úteis para renovação
      registrationYear: athleteAny.registrationYear,
      expirationDate: athleteAny.expirationDate,
      firstRegistrationDate: athleteAny.firstRegistrationDate,
      currentRegistrationDate: athleteAny.currentRegistrationDate
    };

    // Buscar configuração anual para obter taxa de renovação
    const currentYear = new Date().getFullYear();
    const config = await prisma.filiationAnnualConfig.findUnique({
      where: { year: currentYear }
    });

    return NextResponse.json({
      found: true,
      athlete: formattedAthlete,
      renewalFee: config?.renewalFee || 0,
    }, { status: 200 });

  } catch (error) {
    console.error("Erro ao verificar atleta:", error);
    return NextResponse.json(
      { error: "Erro ao verificar atleta" },
      { status: 500 }
    );
  }
}
