import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const config = await prisma.notificationConfig.findFirst({
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(config || {})
  } catch (error) {
    console.error("Erro ao buscar configurações:", error)
    return NextResponse.json(
      { error: "Erro ao buscar configurações" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const data = await request.json()

    // Remove campos sensíveis se estiverem vazios
    if (!data.whatsappToken) delete data.whatsappToken
    if (!data.whatsappPhoneId) delete data.whatsappPhoneId
    if (!data.webhookUrl) delete data.webhookUrl

    // Atualiza ou cria nova configuração
    const config = await prisma.notificationConfig.upsert({
      where: {
        id: data.id || "default"
      },
      update: data,
      create: {
        ...data,
        id: "default"
      }
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error("Erro ao salvar configurações:", error)
    return NextResponse.json(
      { error: "Erro ao salvar configurações" },
      { status: 500 }
    )
  }
}
