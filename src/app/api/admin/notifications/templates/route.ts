import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import * as Handlebars from "handlebars"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const channel = searchParams.get("channel")

    const where = {
      ...(type && { type }),
      ...(channel && { channel }),
      active: true
    }

    const templates = await prisma.notificationTemplate.findMany({
      where,
      orderBy: { updatedAt: "desc" }
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error("Erro ao buscar templates:", error)
    return NextResponse.json(
      { error: "Erro ao buscar templates" },
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

    // Validar template
    try {
      Handlebars.compile(data.content)
    } catch (error) {
      return NextResponse.json(
        { error: "Template inválido: " + (error as Error).message },
        { status: 400 }
      )
    }

    // Extrair variáveis do template
    const variables = extractVariables(data.content)
    
    const template = await prisma.notificationTemplate.upsert({
      where: {
        id: data.id || "default",
      },
      update: {
        ...data,
        variables
      },
      create: {
        ...data,
        variables,
        active: true
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error("Erro ao salvar template:", error)
    return NextResponse.json(
      { error: "Erro ao salvar template" },
      { status: 500 }
    )
  }
}

// Função auxiliar para extrair variáveis do template
function extractVariables(content: string): string[] {
  const regex = /{{([^}]+)}}/g
  const variables = new Set<string>()
  let match

  while ((match = regex.exec(content)) !== null) {
    const variable = match[1].trim()
    if (!variable.startsWith("#") && !variable.startsWith("/")) {
      variables.add(variable)
    }
  }

  return Array.from(variables)
}
