"use server"

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Obter a sessão do usuário
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const registrationId = params.id

    // Buscar a inscrição pelo ID
    const registration = await prisma.registration.findUnique({
      where: { 
        id: registrationId,
      },
      include: {
        Event: true
      }
    })

    // Verificar se a inscrição existe e pertence ao usuário
    if (!registration) {
      return NextResponse.json(
        { error: "Inscrição não encontrada" },
        { status: 404 }
      )
    }

    if (registration.userId !== userId) {
      return NextResponse.json(
        { error: "Você não tem permissão para acessar esta inscrição" },
        { status: 403 }
      )
    }

    // Buscar informações adicionais (modalidade, categoria, etc.)
    let modalityName = null
    let categoryName = null
    let genderName = null
    let tierName = null

    if (registration.modalityid) {
      const modality = await prisma.eventModality.findUnique({
        where: { id: registration.modalityid }
      })
      modalityName = modality?.name || null
    }

    if (registration.categoryid) {
      const category = await prisma.eventCategory.findUnique({
        where: { id: registration.categoryid }
      })
      categoryName = category?.name || null
    }

    if (registration.genderid) {
      // Mapear valores comuns de gênero
      const genderMap: Record<string, string> = {
        'MALE': 'Masculino',
        'FEMALE': 'Feminino',
        'OTHER': 'Outro',
        'BOTH': 'Ambos'
      }
      genderName = genderMap[registration.genderid] || registration.genderid
    }

    if (registration.tierid) {
      const tier = await prisma.eventPricingTier.findUnique({
        where: { id: registration.tierid }
      })
      tierName = tier?.name || null
    }

    // Formatar os dados para a resposta
    const formattedRegistration = {
      id: registration.id,
      protocol: registration.protocol,
      name: registration.name,
      email: registration.email,
      cpf: registration.cpf,
      phone: registration.phone,
      birthdate: registration.birthdate,
      status: registration.status,
      createdAt: registration.createdAt,
      modalityName,
      categoryName,
      genderName,
      tierName,
      eventId: registration.eventId,
      eventName: registration.Event.title,
      eventDate: registration.Event.startDate,
      eventLocation: registration.Event.location,
      addressData: registration.addressdata ? JSON.parse(registration.addressdata) : null
    }

    return NextResponse.json(formattedRegistration)
  } catch (error) {
    console.error("Erro ao buscar detalhes da inscrição:", error)
    return NextResponse.json(
      { error: "Erro ao buscar detalhes da inscrição" },
      { status: 500 }
    )
  }
}
