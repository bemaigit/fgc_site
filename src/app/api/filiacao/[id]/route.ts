import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Buscando filiação:", params.id)

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.log("Usuário não autenticado")
      return Response.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    console.log("Usuário autenticado:", session.user.id)

    // Buscar atleta
    const athlete = await prisma.athlete.findUnique({
      where: { id: params.id },
      include: {
        User: true
      }
    })

    console.log("Atleta encontrado:", athlete)

    if (!athlete) {
      return Response.json(
        { error: "Filiação não encontrada" },
        { status: 404 }
      )
    }

    // Verificar se o usuário tem permissão
    if (athlete.userId !== session.user.id && session.user.role !== "ADMIN") {
      console.log("Usuário sem permissão:", {
        athleteUserId: athlete.userId,
        sessionUserId: session.user.id,
        userRole: session.user.role
      })
      return Response.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    // Buscar modalidades para calcular valor
    const modalities = await prisma.filiationModality.findMany({
      where: {
        name: { in: athlete.modalities }
      }
    })

    console.log("Modalidades encontradas:", modalities)

    // Calcular valor (maior preço entre as modalidades)
    const amount = modalities.length > 0 
      ? Math.max(...modalities.map(m => Number(m.price)))
      : 0

    console.log("Valor calculado:", amount)

    const response = {
      id: athlete.id,
      amount,
      modalities: athlete.modalities,
      category: athlete.category
    }

    console.log("Resposta final:", response)

    return Response.json(response)
  } catch (error) {
    console.error("Erro ao buscar detalhes da filiação:", error)
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
