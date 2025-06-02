import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import * as Handlebars from "handlebars"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { template, data } = await request.json()

    // Compilar e renderizar o template
    try {
      const compiled = Handlebars.compile(template)
      const html = compiled(data)

      return NextResponse.json({ html })
    } catch (error) {
      return NextResponse.json(
        { error: "Erro ao compilar template: " + (error as Error).message },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Erro ao gerar preview:", error)
    return NextResponse.json(
      { error: "Erro ao gerar preview" },
      { status: 500 }
    )
  }
}
